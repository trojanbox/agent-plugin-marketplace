import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseOneDriveArgs, cloudSegments, contentEndpoint, childrenEndpoint,
  searchEndpoint, assertGraphUrl, assertTransferUrl, uploadSessionEndpoint, localDownloadName } from '../scripts/onedrive-core.mjs';
import { executeOneDrive, configLocation } from '../scripts/onedrive.mjs';
import { readPrivateJson, writePrivateJson } from '../scripts/youtube-io.mjs';

const CLIENT='46db9c59-46bb-4cab-a23a-5f16a19854ac';
const HOME='/tmp/onedrive-example';
const j=(data, status=200, headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});
const fail=status=>error=>error.status===status;
async function setup(t, responder, clock=1730000000000) {
  const home=await fs.mkdtemp(path.join(os.tmpdir(),'onedrive-workflow-'));
  t.after(()=>fs.rm(home,{recursive:true,force:true}));
  let time=clock;
  const calls=[];
  const fetcher=async (url,opts)=>{calls.push({url:String(url),opts});return await responder(String(url),opts);};
  const ctx={home,fetch:fetcher,now:()=>time};
  const run=args=>executeOneDrive(parseOneDriveArgs(args),ctx);
  const locations=configLocation(home);
  return {home,ctx,run,calls,paths:locations,tick(ms){time+=ms;}};
}
async function authenticated(s, token='fixture-access', expires=2000000000000) {
  await s.run(['configure',CLIENT]);
  await writePrivateJson(s.paths.tokens,
    {schema:1,access_token:token,refresh_token:'fixture-refresh',expires_at:expires});
}
function item(id, name, type='file', size=0) {
  return {id,name,size,...(type==='file'?{file:{}}:{folder:{}})};
}
test('CLI argument parsing enforces cloud paths, opt-in overwrite and explicit trash',()=>{
  assert.deepEqual(parseOneDriveArgs([]),{command:'help'});
  assert.equal(parseOneDriveArgs(['configure',CLIENT,'--tenant','consumers']).tenant,'consumers');
  assert.equal(parseOneDriveArgs(['list']).remotePath,'');
  assert.equal(parseOneDriveArgs(['list','My Documents','--limit','25']).limit,25);
  assert.equal(parseOneDriveArgs(['upload','/tmp/你好.txt','Book','--name','新书.txt']).name,'新书.txt');
  assert.equal(parseOneDriveArgs(['auth','complete']).action,'complete');
  assert.equal(parseOneDriveArgs(['download','Books/a.pdf','--dir','/tmp/x']).remotePath,'Books/a.pdf');
  assert.equal(parseOneDriveArgs(['trash','Folder','--confirm','yes']).command,'trash');
  const invalid=[['configure','not-a-uuid'],['configure',CLIENT,'--tenant','../../evil'],
    ['auth','token'],['trash','x'],['trash','/','--confirm','yes'],
    ['download','../secrets'],['list','foo/../bar'],['info','/etc/passwd'],['list','foo\\bar'],
    ['list','foo','--limit','100000'],['upload','/tmp/example','..'],
    ['upload','/tmp/example','foo','--name','../bad'],['download','f','--overwrite','maybe'],
    ['search',''],['search','x','--dir','/tmp'],['mkdir','foo/'],['configure',CLIENT,'--cookies','no']];
  for(const argv of invalid) assert.throws(()=>parseOneDriveArgs(argv),fail('invalid_input'));
});
test('trust boundaries only allow Microsoft Graph v1.0 and approved temporary transfer hosts',()=>{
  assert.deepEqual(cloudSegments('中文/资料 (1).txt'),['中文','资料 (1).txt']);
  assert.equal(childrenEndpoint('Folder'),'/me/drive/root:/Folder:/children');
  assert.equal(contentEndpoint('Fo#lder/file %20.docx'),'/me/drive/root:/Fo%23lder/file%20%2520.docx:/content');
  assert.equal(uploadSessionEndpoint('My Files/a.pdf'),'/me/drive/root:/My%20Files/a.pdf:/createUploadSession');
  assert.equal(searchEndpoint("Bob's files"),"/me/drive/root/search(q=%27Bob%27%27s%20files%27)");
  assert.equal(assertGraphUrl('https://graph.microsoft.com/v1.0/me/drive'), 'https://graph.microsoft.com/v1.0/me/drive');
  assert.throws(()=>assertGraphUrl('https://graph.microsoft.com/v1.0/me/messages'),fail('file_security'));
  assert.equal(localDownloadName('长'.repeat(150)+'.pdf','fallback').endsWith('.pdf'),true);
  assert.ok(Buffer.byteLength(localDownloadName('长'.repeat(150)+'.pdf','fallback')) <= 180);
  for(const x of ['https://evil.example/v1.0/me','http://graph.microsoft.com/v1.0/a',
    'https://graph.microsoft.com.evil.example/v1.0','https://graph.microsoft.com/beta/me',
    'https://graph.microsoft.com@evil.test/v1.0/me'])assert.throws(()=>assertGraphUrl(x),fail('file_security'));
  for(const x of ['http://a.1drv.com/download','https://1drv.com.evil.example/files',
    'https://example.com/a','https://127.0.0.1/x','https://user:password@a.sharepoint.com/path']) {
    assert.throws(()=>assertTransferUrl(x),fail('file_security'));
  }
  assert.equal(assertTransferUrl('https://sn3201.up.1drv.com/up/token'),
    'https://sn3201.up.1drv.com/up/token');
  assert.equal(assertTransferUrl('https://example.sharepoint.com/payload'),
    'https://example.sharepoint.com/payload');
});
test('configure and auth status do not require network or return secrets',async t=>{
  const s=await setup(t,()=>{throw Error('unexpected network')});
  assert.deepEqual(await s.run(['auth','status']),{ok:true,status:'auth_status',configured:false,
    authenticated:false,token_valid:false,pending:false,tenant:null});
  const result=await s.run(['configure',CLIENT,'--tenant','common']);
  assert.equal(result.status,'configured');
  assert.equal((await s.run(['auth','status'])).configured,true);
  const stat=await fs.lstat(s.paths.config);
  assert.ok(stat.isFile()&&!stat.isSymbolicLink()&&!(stat.mode&0o077));
  assert.equal((await readPrivateJson(s.paths.config)).client_id,CLIENT);
  assert.throws(()=>parseOneDriveArgs(['configure','22222222-2222-4222-8222-222222222222','--tenant','oops']),
    fail('invalid_input'));
});
test('device-code auth is two-step and never prints or leaks device/refresh tokens',async t=>{
  const s=await setup(t,(url,opts)=>{
    if(url.endsWith('/devicecode'))return j({device_code:'private-device-secret',user_code:'KZ123',interval:5,
      expires_in:900,verification_uri:'https://microsoft.com/devicelogin'});
    if(url.endsWith('/token'))return j({access_token:'private-access-token',refresh_token:'private-refresh-token',
      expires_in:3600,token_type:'Bearer'});
    throw Error('unexpected network');
  });
  await s.run(['configure',CLIENT]);
  const start=await s.run(['auth','start']);
  assert.equal(start.status,'authorization_started');
  assert.equal(start.user_code,'KZ123');
  assert.ok(!JSON.stringify(start).includes('private-device-secret'));
  assert.equal((await s.run(['auth','status'])).pending,true);
  await assert.rejects(()=>s.run(['auth','complete']),fail('auth_pending'));
  s.tick(6000);
  const done=await s.run(['auth','complete']);
  assert.equal(done.status,'authenticated');
  assert.ok(!JSON.stringify(done).includes('private-access-token'));
  assert.equal((await readPrivateJson(s.paths.tokens)).refresh_token,'private-refresh-token');
  const stat=await fs.lstat(s.paths.tokens);
  assert.ok(stat.isFile()&&!(stat.mode&0o077));
  assert.equal((await s.run(['auth','status'])).authenticated,true);
  const logout=await s.run(['auth','logout']);
  assert.equal(logout.status,'logged_out');
  assert.equal((await s.run(['auth','status'])).authenticated,false);
});
test('device-code authorization pending obeys polling interval without blind retry',async t=>{
  let polls=0;
  const s=await setup(t,(url)=>{
    if(url.endsWith('/devicecode'))return j({device_code:'secret',user_code:'PUBLIC',interval:5,expires_in:900,
      verification_uri:'https://microsoft.com/devicelogin'});
    polls++;
    return j({error:'authorization_pending'},400);
  });
  await s.run(['configure',CLIENT]);await s.run(['auth','start']);s.tick(6000);
  await assert.rejects(()=>s.run(['auth','complete']),fail('auth_pending'));
  assert.equal(polls,1);
  await assert.rejects(()=>s.run(['auth','complete']),fail('auth_pending'));
  assert.equal(polls,1);
});
test('token refresh is private, handles expiry and never exposes refresh token to output',async t=>{
  const s=await setup(t,(url,opts)=>{
    if(url.endsWith('/token')){
      assert.match(opts.body,/grant_type=refresh_token/u);
      return j({access_token:'fresh-access',refresh_token:'fresh-refresh',expires_in:3600,token_type:'Bearer'});
    }
    assert.equal(opts.headers.Authorization,'Bearer fresh-access');
    return j(item('root','root','folder'));
  });
  await authenticated(s,'expired-access',1000);
  assert.equal((await s.run(['info','/'])).status,'item_info');
  const stored=await readPrivateJson(s.paths.tokens);
  assert.equal(stored.access_token,'fresh-access');
  assert.equal(stored.refresh_token,'fresh-refresh');
  assert.equal((await s.run(['auth','status'])).token_valid,true);
});
test('list paginates and searches/metadata keep authenticated Graph requests scoped',async t=>{
  const s=await setup(t,(url,opts)=>{
    assert.equal(opts.headers.Authorization,'Bearer fixture-access');
    if(url.endsWith('/root'))return j(item('root','root','folder'));
    if(url.includes('/root/children')&&!url.includes('next='))return j({value:[item('1','alpha.txt')],
      '@odata.nextLink':'https://graph.microsoft.com/v1.0/me/drive/root/children?next=1'});
    if(url.includes('next=1'))return j({value:[item('2','beta','folder')]});
    if(url.includes('/search('))return j({value:[item('3','中文.txt')]});
    if(url.includes(encodeURIComponent('资料.txt')))return j(item('4','资料.txt'));
    throw Error('unexpected endpoint: '+url);
  });
  await authenticated(s);
  const ls=await s.run(['list','/']);
  assert.deepEqual(ls.entries.map(v=>v.name),['alpha.txt','beta']);
  assert.equal(ls.truncated,false);
  const short=await s.run(['list','/','--limit','1']);
  assert.equal(short.entries.length,1);assert.equal(short.truncated,true);
  assert.equal((await s.run(['search','中文'])).entries[0].name,'中文.txt');
  assert.equal((await s.run(['info','资料.txt'])).item.id,'4');
});
test('mkdir writes with fail-on-conflict, trash requires opt-in and uses item-id',async t=>{
  const calls=[];
  const s=await setup(t,(url,opts)=>{
    calls.push({url,opts});
    if(url.endsWith('/root'))return j(item('root','root','folder'));
    if(url.includes('root:/Folder'))return j(item('file1','Folder','folder'));
    if(url.endsWith('/children') && opts.method==='POST'){
      assert.equal(JSON.parse(opts.body)['@microsoft.graph.conflictBehavior'],'fail');
      return j(item('new','New','folder'),201);
    }
    if(url.endsWith('/items/file1') && opts.method==='DELETE')return new Response(null,{status:204});
    throw Error('unexpected request '+url);
  });
  await authenticated(s);
  const folder=await s.run(['mkdir','New']);
  assert.equal(folder.status,'folder_created');
  const deleted=await s.run(['trash','Folder','--confirm','yes']);
  assert.equal(deleted.status,'trashed');
  assert.ok(calls.some(c=>c.opts.method==='DELETE'));
});
test('download follows preauthorized URL without leaking Authorization header and verifies file',async t=>{
  const bytes=Buffer.from('this is private OneDrive data');
  const sha1=createHash('sha1').update(bytes).digest('hex').toUpperCase();
  const s=await setup(t,(url,opts)=>{
    if(url.endsWith('report.txt'))return j({...item('a','report.txt','file',bytes.length),
      file:{hashes:{sha1Hash:sha1}}});
    if(url.includes(':/content')) {
      assert.equal(opts.headers.Authorization,'Bearer fixture-access');
      return new Response(null,{status:302,headers:{Location:'https://sn123.up.1drv.com/download?id=ok'}});
    }
    if(url.startsWith('https://sn123.up.1drv.com/')){
      assert.ok(!opts.headers?.Authorization);
      return new Response(bytes,{status:200});
    }
    throw Error('unexpected request: '+url);
  });
  await authenticated(s);
  const outdir=path.join(s.home,'out');
  const result=await s.run(['download','report.txt','--dir',outdir]);
  assert.equal(result.status,'downloaded');
  assert.deepEqual(await fs.readFile(result.path),bytes);
  assert.equal(result.sha256,createHash('sha256').update(bytes).digest('hex'));
  await assert.rejects(()=>s.run(['download','report.txt','--dir',outdir]),fail('file_exists'));
});
test('download rejects untrusted redirect URL before using bearer token or writing destination',async t=>{
  const s=await setup(t,(url)=>{
    if(url.endsWith('report.txt'))return j(item('a','report.txt','file',4));
    return new Response(null,{status:302,headers:{Location:'https://evil.example/steal-token'}});
  });
  await authenticated(s);
  const dir=path.join(s.home,'out');
  await assert.rejects(()=>s.run(['download','report.txt','--dir',dir]),fail('file_security'));
  assert.deepEqual((await fs.readdir(dir)).filter(f=>!f.startsWith('.')),[]);
});
test('upload chunks sequentially and verifies response without forwarding bearer to upload URL',async t=>{
  const len=327680*10+17;
  const fileContents=Buffer.alloc(len,0x5a);
  const s=await setup(t,(url,opts)=>{
    if(url.endsWith('/root'))return j(item('root','root','folder'));
    if(url.endsWith(':/createUploadSession')){
      assert.equal(opts.headers.Authorization,'Bearer fixture-access');
      assert.equal(JSON.parse(opts.body).item['@microsoft.graph.conflictBehavior'],'fail');
      return j({uploadUrl:'https://sn321.up.1drv.com/up/token'},200);
    }
    if(url==='https://sn321.up.1drv.com/up/token'){
      assert.ok(!opts.headers.Authorization);
      if(opts.headers['Content-Range'].startsWith('bytes 0-')) {
        assert.equal(opts.body.length,327680*10);
        return j({nextExpectedRanges:[String(327680*10)+'-']},202);
      }
      assert.match(opts.headers['Content-Range'],/bytes 3276800-3276816\/3276817/u);
      return j(item('new-upload','sample.bin','file',len),201);
    }
    throw Error('unexpected upload endpoint: '+url);
  });
  await authenticated(s);
  const local=path.join(s.home,'sample.bin');
  await fs.writeFile(local,fileContents);
  const result=await s.run(['upload',local,'/']);
  assert.equal(result.status,'uploaded');
  assert.equal(result.size,len);
  assert.equal(result.sha256,createHash('sha256').update(fileContents).digest('hex'));
});
test('upload session rejects unsafe URL and conflict; local file remains untouched',async t=>{
  for(const kind of ['host','conflict']){
    const s=await setup(t,(url)=>{
      if(url.endsWith('/root'))return j(item('root','root','folder'));
      if(url.endsWith(':/createUploadSession')){
        if(kind==='host')return j({uploadUrl:'http://127.0.0.1/steal'});
        return j({error:{code:'nameAlreadyExists'}},409);
      }
      throw Error('unexpected');
    });
    await authenticated(s);
    const local=path.join(s.home,'sample.txt');await fs.writeFile(local,'safe');
    await assert.rejects(()=>s.run(['upload',local,'/']),fail(kind==='host'?'file_security':'file_exists'));
    assert.equal(await fs.readFile(local,'utf8'),'safe');
  }
});
test('Graph pagination rejects external nextLink even when Graph returned it',async t=>{
  const s=await setup(t,(url)=>{
    if(url.endsWith('/root'))return j(item('root','root','folder'));
    return j({value:[item('a','a')],'@odata.nextLink':'https://attacker.example/exfil'});
  });
  await authenticated(s);
  await assert.rejects(()=>s.run(['list','/']),fail('file_security'));
});
