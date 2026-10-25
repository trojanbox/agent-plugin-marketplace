import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { YoutubeError, parseRequest, requestIdentity } from '../scripts/youtube-core.mjs';
import { runProcess, safeDirectory, outputDirectory, regularFile, hashFile, writePrivateJson, readPrivateJson,
  acquireLock, inventory, publishFile } from '../scripts/youtube-io.mjs';
import { RELEASES, assetFor, validateDownloadUrl, extractZip, installDependency, ensureDependencies, dependencyRoot } from '../scripts/youtube-deps.mjs';
import { openState } from '../scripts/youtube.mjs';
const status = expected => e => e instanceof YoutubeError && e.status === expected;
async function sandbox(t) {
  const home=await fs.mkdtemp(path.join(os.tmpdir(),'youtube-io-'));
  t.after(()=>fs.rm(home,{recursive:true,force:true}));return home;
}
function zipFixture(entries) {
  const locals=[],centrals=[];let offset=0;
  for(const {name,content='fake executable',kind=0o100700,method=8} of entries) {
    const filename=Buffer.from(name),raw=Buffer.from(content),data=method===8?deflateRawSync(raw):raw;
    const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(method,8);
    local.writeUInt32LE(data.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(filename.length,26);
    const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(0x0314,4);central.writeUInt16LE(20,6);
    central.writeUInt16LE(method,10);central.writeUInt32LE(data.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(filename.length,28);
    central.writeUInt32LE((kind*65536)>>>0,38);central.writeUInt32LE(offset,42);
    locals.push(local,filename,data);centrals.push(central,filename);offset+=local.length+filename.length+data.length;
  }
  const dir=Buffer.concat(centrals),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(dir.length,12);end.writeUInt32LE(offset,16);
  return Buffer.concat([...locals,dir,end]);
}

test('directories resolve Unicode/space paths and isolate original email directory',async t=>{
  const home=await sandbox(t);const output=path.join(home,'Downloads','中文 path');
  assert.equal(await outputDirectory(output,home),output);
  await assert.rejects(()=>outputDirectory(path.join(home,'.agent-plugin-marketplace','email','downloads'),home),status('file_security'));
  assert.equal(dependencyRoot(home),path.join(home,'.agent-plugin-marketplace','youtube'));
});
test('existing symlink/junction paths and private directories writable by others are rejected',async t=>{
  const home=await sandbox(t);await fs.mkdir(path.join(home,'actual'));await fs.symlink(path.join(home,'actual'),path.join(home,'link'),'dir');
  await assert.rejects(()=>safeDirectory(path.join(home,'link','sub')),status('file_security'));
  if(process.platform!=='win32'){
    await fs.chmod(path.join(home,'actual'),0o777);
    await assert.rejects(()=>safeDirectory(path.join(home,'actual'),{privateLeaf:true}),status('file_security'));
  }
});
test('private JSON writes are atomic and do not follow links',async t=>{
  const home=await sandbox(t),file=path.join(home,'state.json');
  await writePrivateJson(file,{value:1});await writePrivateJson(file,{value:2});assert.deepEqual(await readPrivateJson(file),{value:2});
  const other=path.join(home,'other');await fs.writeFile(other,'do not change');await fs.symlink(other,path.join(home,'linked'));
  await assert.rejects(()=>writePrivateJson(path.join(home,'linked'),{}),status('file_security'));
  assert.equal(await fs.readFile(other,'utf8'),'do not change');
});
test('per-target lock prevents concurrent mutation and only releases owned tokens',async t=>{
  const home=await sandbox(t),file=path.join(home,'lock');const release=await acquireLock(file);
  await assert.rejects(()=>acquireLock(file),status('locked'));await release();
  const again=await acquireLock(file);await again();await assert.rejects(()=>fs.stat(file),{code:'ENOENT'});
});
test('same-host dead PID lock is recoverable; foreign host lock is not',async t=>{
  const home=await sandbox(t),file=path.join(home,'lock');
  await writePrivateJson(file,{pid:2147483647,host:os.hostname(),token:'dead'});
  const release=await acquireLock(file);await release();
  await writePrivateJson(file,{pid:2147483647,host:'another-machine',token:'foreign'});
  await assert.rejects(()=>acquireLock(file),status('locked'));
});
test('publication never clobbers without permission; authorized replacement is atomic',async t=>{
  const home=await sandbox(t),source=path.join(home,'source'),target=path.join(home,'target');
  await fs.writeFile(source,'new');await fs.writeFile(target,'old');
  await assert.rejects(()=>publishFile(source,target,false),status('file_exists'));
  assert.equal(await fs.readFile(target,'utf8'),'old');await publishFile(source,target,true);assert.equal(await fs.readFile(target,'utf8'),'new');
  const another=path.join(home,'another');await fs.writeFile(another,'next');await publishFile(another,path.join(home,'newfile'),false);
  assert.equal((await regularFile(path.join(home,'newfile'))).nlink,1);
});
test('publication rejects symlink and hardlinked destinations even with overwrite authorization',async t=>{
  const home=await sandbox(t),source=path.join(home,'source'),outside=path.join(home,'outside'),target=path.join(home,'target');
  await fs.writeFile(source,'new');await fs.writeFile(outside,'preserve');await fs.symlink(outside,target);
  await assert.rejects(()=>publishFile(source,target,true),status('file_security'));assert.equal(await fs.readFile(outside,'utf8'),'preserve');
  await fs.unlink(target);await fs.link(outside,target);
  await assert.rejects(()=>publishFile(source,target,true),status('file_security'));
});
test('resume requires exact parameter binding and unchanged SHA-256 for every partial file',async t=>{
  const home=await sandbox(t),stage=await safeDirectory(path.join(home,'stage'),{privateLeaf:true});
  const request=parseRequest(['video','https://youtu.be/BaW_jenozKc'],home);
  assert.equal(await openState(stage,request),null);
  await fs.writeFile(path.join(stage,'raw.mp4.part'),'some bytes');
  await assert.rejects(()=>openState(stage,request),status('resume_invalid'));
  await writePrivateJson(path.join(stage,'state.json'),{schema:1,request:requestIdentity(request),plan:{},files:await inventory(stage)});
  assert.ok(await openState(stage,request));
  await fs.writeFile(path.join(stage,'__proto__'),'unexpected file');
  await assert.rejects(()=>openState(stage,request),status('resume_invalid'));
  await fs.unlink(path.join(stage,'__proto__'));
  await fs.writeFile(path.join(stage,'raw.mp4.part'),'tampered bytes');
  await assert.rejects(()=>openState(stage,request),status('resume_invalid'));
});
test('shell metacharacters are literal subprocess arguments, with bounded output and time',async t=>{
  const home=await sandbox(t),bad='$(touch '+path.join(home,'SHOULD_NOT_EXIST')+')';
  const r=await runProcess(process.execPath,['-e','console.log(process.argv[1])',bad]);assert.equal(r.stdout.trim(),bad);
  await assert.rejects(()=>fs.stat(path.join(home,'SHOULD_NOT_EXIST')),{code:'ENOENT'});
  await assert.rejects(()=>runProcess(process.execPath,['-e','setInterval(()=>{},1000)'],{timeoutMs:100}),status('timeout'));
  await assert.rejects(()=>runProcess(process.execPath,['-e','console.log("x".repeat(10000))'],{maxOutput:100}),status('output_limit'));
});
test('subprocess abort signal stops execution and reports interruption',async()=>{
  const controller=new AbortController();controller.abort();
  await assert.rejects(()=>runProcess(process.execPath,['-e','console.log(1)'],{signal:controller.signal}),status('interrupted'));
});
test('pinned manifests carry official, versioned URLs and genuine recorded SHA-256 digests',()=>{
  for(const [tool,group] of Object.entries(RELEASES.tools)) for(const [platform,asset] of Object.entries(group.assets)){
    assert.match(asset.sha256,/^[0-9a-f]{64}$/u);assert.ok(asset.size>1000);assert.equal(new URL(asset.url).hostname,'github.com');
    assert.ok(!asset.url.includes('/latest/'));assert.equal(assetFor(tool,platform).version,group.version);
  }
  assert.throws(()=>assetFor('ffmpeg','darwin-arm64'),status('unsupported_platform'));
  assert.throws(()=>assetFor('ytdlp','alien-cpu'),status('unsupported_platform'));
});
test('dependency downloads refuse non-official endpoints, HTTP and URL credentials',()=>{
  for(const u of ['https://example.com/bin','http://github.com/yt-dlp/bin','https://u:p@github.com/bin','https://github.com.evil.invalid/bin']) {
    assert.throws(()=>validateDownloadUrl(u),status('dependency_integrity'));
  }
  assert.equal(validateDownloadUrl('https://release-assets.githubusercontent.com/file').protocol,'https:');
});
test('ZIP extractor extracts only exact binary names and refuses traversal, links and duplicates',async t=>{
  const home=await sandbox(t),archive=path.join(home,'a.zip'),out=await safeDirectory(path.join(home,'out'),{privateLeaf:true});
  await fs.writeFile(archive,zipFixture([{name:'deno',content:'good'},{name:'../escape',content:'bad'}]));
  await extractZip(archive,out,{deno:'deno'});assert.equal(await fs.readFile(path.join(out,'deno'),'utf8'),'good');await assert.rejects(()=>fs.stat(path.join(home,'escape')),{code:'ENOENT'});
  for(const entries of [[{name:'deno',kind:0o120777}],[{name:'deno'},{name:'deno'}],[{name:'../deno'}]]){
    await fs.rm(path.join(out,'deno'),{force:true});await fs.writeFile(archive,zipFixture(entries));
    await assert.rejects(()=>extractZip(archive,out,{deno:'deno'}),status('dependency_integrity'));
  }
});
test('tampered release fails before any dependency executable can run or be installed',async t=>{
  const home=await sandbox(t);
  await assert.rejects(()=>installDependency('ytdlp',{home,key:'linux-x64',download:async(_asset,file)=>fs.writeFile(file,'tampered')}),status('dependency_integrity'));
  const root=dependencyRoot(home);const names=await fs.readdir(path.join(root,'bin'));
  assert.deepEqual(names,[]);
});
test('automatic installation prohibition is honored before any directory mutation',async t=>{
  const home=await sandbox(t);
  await assert.rejects(()=>installDependency('ytdlp',{home,key:'linux-x64',env:{YOUTUBE_AUTO_INSTALL:'0'}}),status('dependency_missing'));
  await assert.rejects(()=>fs.stat(dependencyRoot(home)),{code:'ENOENT'});
});
test('read-only doctor probes existing dependencies without installation and reports EJS honestly',async t=>{
  const home=await sandbox(t);const calls=[];
  const runner=async(bin,args)=>{calls.push([bin,args]);const line=bin==='yt-dlp'?RELEASES.tools.ytdlp.version:bin==='ffmpeg'?'ffmpeg version 8.0':bin==='ffprobe'?'ffprobe version 8.0':bin==='deno'?'deno 2.9.8':'';return{code:line?0:1,stdout:line+'\n',stderr:''};};
  const deps=await ensureDependencies({home,checkOnly:true,runner,env:{},key:'linux-x64'});
  assert.equal(deps.ytdlp.source,'host');assert.equal(deps.ejs,'host_package_requires_ejs');
  await assert.rejects(()=>fs.stat(dependencyRoot(home)),{code:'ENOENT'});
  assert.ok(calls.every(([,args])=>args.length===1));
});
test('explicit dependency override is never silently ignored for another binary',async t=>{
  const home=await sandbox(t);
  await assert.rejects(()=>ensureDependencies({home,env:{YOUTUBE_YTDLP_BIN:'/invalid/old'},runner:async()=>({code:0,stdout:'2020.01.01\n'}),checkOnly:true}),status('dependency_version'));
});


test('UTF-8 split across subprocess pipe chunks preserves Chinese output and errors',async()=>{
  const program='const b=Buffer.from("中文标点");process.stdout.write(b.subarray(0,1));process.stderr.write(b.subarray(0,2));setTimeout(()=>{process.stdout.write(b.subarray(1));process.stderr.write(b.subarray(2));},20)';
  const result=await runProcess(process.execPath,['-e',program]);
  assert.equal(result.stdout,'中文标点');assert.equal(result.stderr,'中文标点');
});
