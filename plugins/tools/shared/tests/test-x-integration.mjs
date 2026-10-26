/** Offline X extractor test double + real FFmpeg/ffprobe; never needs X account or Cookies. */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { runProcess, hashFile } from '../scripts/youtube-io.mjs';
import { executeXRequest } from '../scripts/x.mjs';
import { parseXRequest, xKey, xOutputName } from '../scripts/x-core.mjs';
import { verifyMedia } from '../scripts/youtube-media.mjs';

const ffmpeg=process.env.YOUTUBE_TEST_FFMPEG || 'ffmpeg';
const ffprobe=process.env.YOUTUBE_TEST_FFPROBE || 'ffprobe';
const available=spawnSync(ffmpeg,['-version'],{stdio:'ignore'}).status===0 &&
  spawnSync(ffprobe,['-version'],{stdio:'ignore'}).status===0;
const options={skip:available?false:'FFmpeg/ffprobe not found; provide YOUTUBE_TEST_FFMPEG/YOUTUBE_TEST_FFPROBE'};
const POST='2103382268051964103',MEDIA='2103381602994659329',URL=`https://x.com/jcarlos2001/status/${POST}`;
const TITLE='X 中文：计算机 / 讲座？';
const deps={ytdlp:{path:'/mock/yt-dlp',source:'managed'},ffmpeg:{path:ffmpeg},ffprobe:{path:ffprobe},
  js:{type:'node',path:process.execPath}};
let fixtures, audible, silent;
before(async()=>{
  if (!available) return;
  fixtures=await fs.mkdtemp(path.join(os.tmpdir(),'x-media-fixtures-'));
  audible=path.join(fixtures,'audible.mp4');
  silent=path.join(fixtures,'silent.mp4');
  const video=['-nostdin','-v','error','-y','-f','lavfi','-i','testsrc2=size=320x180:rate=10'];
  const av=await runProcess(ffmpeg,[...video,'-f','lavfi','-i','sine=frequency=440:sample_rate=48000',
    '-t','1.4','-c:v','libx264','-preset','ultrafast','-c:a','aac','-threads','1',audible]);
  assert.equal(av.code,0,av.stderr);
  const gif=await runProcess(ffmpeg,[...video,'-t','1.4','-an','-c:v','libx264','-preset','ultrafast',
    '-threads','1',silent]);
  assert.equal(gif.code,0,gif.stderr);
});
after(async()=>{if(fixtures)await fs.rm(fixtures,{recursive:true,force:true});});

async function setup(t,settings={}){
  const home=await fs.mkdtemp(path.join(os.tmpdir(),'x-workflow-'));
  t.after(()=>fs.rm(home,{recursive:true,force:true}));
  let downloads=0,metadataCount=0;const calls=[];
  const runner=async(bin,args,opts)=>{
    calls.push({bin,args,opts:{cwd:opts?.cwd}});
    if(bin!==deps.ytdlp.path)return await runProcess(bin,args,opts);
    if(args.includes('--dump-single-json')){
      metadataCount++;
      if(settings.metadataError)return {code:1,stdout:'null\n',stderr:settings.metadataError};
      const info={id:settings.changeMediaId&&metadataCount>1?'2103381602994659328':MEDIA,
        display_id:settings.badPost?'1234567890':POST,extractor_key:'Twitter',
        title:settings.changeTitle&&metadataCount>1?'新标题':TITLE,
        age_limit:settings.restricted?18:0, duration:1.4,
        format_id:'http-950',ext:'mp4',height:180,vcodec:'h264',acodec:settings.silent?'none':'aac'};
      if(settings.multiple){info._type='playlist';info.entries=[{...info}];}
      return {code:0,stdout:JSON.stringify(info),stderr:''};
    }
    downloads++;
    if(settings.wait)await settings.wait();
    if(settings.interruptOnce&&downloads===1){
      await fs.writeFile(path.join(opts.cwd,'raw.mp4.part'),'partial media fixture');
      return {code:1,stdout:'',stderr:'Connection reset by peer'};
    }
    if(settings.escape)return {code:0,stdout:JSON.stringify(path.join(home,'escaped.mp4'))+'\n',stderr:''};
    const file=path.join(opts.cwd,'raw.mp4');
    if(settings.corrupt)await fs.writeFile(file,'invalid media');
    else await fs.copyFile(settings.silent?silent:audible,file);
    await fs.rm(path.join(opts.cwd,'raw.mp4.part'),{force:true});
    return {code:0,stdout:JSON.stringify(file)+'\n',stderr:''};
  };
  return {home,calls,request:(argv)=>parseXRequest(argv,home),
    ctx:{home,env:{HOME:home,PATH:process.env.PATH},runner,dependencyResolver:async()=>deps},
    downloads:()=>downloads};
}

for(const [mode,format] of [['video','mp4'],['video','mkv'],['audio','mp3'],['audio','m4a']]){
  test(`real ${mode} ${format} media processing, metadata, hash and title`,options,async t=>{
    const s=await setup(t),request=s.request([mode,URL,'--format',format]);
    const result=await executeXRequest(request,s.ctx);
    assert.equal(result.ok,true);assert.equal(result.status,'downloaded');assert.equal(result.platform,'x');
    assert.equal(result.post_id,POST);assert.equal(result.media_id,MEDIA);
    assert.equal(result.file,path.join(request.directory,xOutputName(request,TITLE)));
    assert.equal(result.sha256,await hashFile(result.file));
    assert.equal(result.audio_codec,mode==='audio'?(format==='mp3'?'mp3':'aac'):'aac');
    assert.equal(result.height,mode==='audio'?undefined:180);
    assert.equal(s.downloads(),1);
    assert.equal(s.calls.filter(x=>x.bin===deps.ytdlp.path).length,2);
    const before=await hashFile(result.file);
    await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='file_exists');
    assert.equal(await hashFile(result.file),before);
    assert.equal(s.downloads(),1);
  });
}
test('X animated GIF / silent MP4 is supported as a video but audio download fails',options,async t=>{
  const s=await setup(t,{silent:true});
  const request=s.request(['video',URL]);
  const result=await executeXRequest(request,s.ctx);
  assert.equal(result.audio_codec,null);
  assert.equal(result.height,180);
  await assert.rejects(()=>verifyMedia(result.file,request,deps,1.4),e=>e.status==='verification_failed');
  await assert.rejects(()=>executeXRequest(s.request(['audio',URL]),s.ctx),e=>e.status==='video_unavailable');
  assert.equal(s.downloads(),1);
});
test('X multi-media tweets require explicit video index and never download a whole playlist',options,async t=>{
  const s=await setup(t,{multiple:true});
  await assert.rejects(()=>executeXRequest(s.request(['video',URL]),s.ctx),
    e=>e.status==='multiple_media_unsupported');
  assert.equal(s.downloads(),0);
});
test('video/2 URL gets only the selected media, with a distinct filename',options,async t=>{
  const s=await setup(t); const request=s.request(['video',URL+'/video/2']);
  const result=await executeXRequest(request,s.ctx);
  assert.equal(result.media_index,2);
  assert.match(path.basename(result.file),/\.video2\.h1080\.mp4$/u);
});
test('interrupted download keeps hashed fragments and resumes with unchanged source identity',options,async t=>{
  const s=await setup(t,{interruptOnce:true});
  const request=s.request(['video',URL]);
  await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='network_error'&&e.details.partial_files_preserved);
  const stage=path.join(request.directory,'.x-partials',xKey(request));
  const state=JSON.parse(await fs.readFile(path.join(stage,'state.json'),'utf8'));
  assert.ok(state.files['raw.mp4.part'].sha256);
  assert.equal(state.plan.mediaId,MEDIA);
  const result=await executeXRequest(request,s.ctx);
  assert.equal(result.recovered,true);assert.equal(s.downloads(),2);
  await assert.rejects(()=>fs.stat(stage),{code:'ENOENT'});
});
test('title changes across a verified resume do not change X post/media identity',options,async t=>{
  const s=await setup(t,{interruptOnce:true,changeTitle:true});
  const request=s.request(['audio',URL]);
  await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='network_error');
  const result=await executeXRequest(request,s.ctx);
  assert.equal(result.recovered,true);
  assert.equal(path.basename(result.file),'新标题.mp3');
});
test('fragment tampering and changed media identity stop recovery without downloading again',options,async t=>{
  for(const kind of ['fragment','mediaId']){
    const s=await setup(t,{interruptOnce:true,changeMediaId:kind==='mediaId'});
    const request=s.request(['video',URL]);
    await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='network_error');
    if(kind==='fragment'){
      const stage=path.join(request.directory,'.x-partials',xKey(request));
      await fs.writeFile(path.join(stage,'raw.mp4.part'),'tampered');
    }
    await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='resume_invalid');
    assert.equal(s.downloads(),1);
  }
});
test('same title file collision prevents downloader execution and protects existing file',options,async t=>{
  const s=await setup(t),request=s.request(['audio',URL]);
  await fs.mkdir(request.directory,{recursive:true});
  const dest=path.join(request.directory,xOutputName(request,TITLE));
  await fs.writeFile(dest,'existing, untouched');
  await assert.rejects(()=>executeXRequest(request,s.ctx),
    e=>e.status==='file_exists'&&e.details.existing_file===dest);
  assert.equal(await fs.readFile(dest,'utf8'),'existing, untouched');
  assert.equal(s.downloads(),0);
});
test('failed overwrite preserves old completion and authorized overwrite replaces one target',options,async t=>{
  const s=await setup(t,{corrupt:true}),request=s.request(['video',URL,'--overwrite','yes']);
  await fs.mkdir(request.directory,{recursive:true});
  const old=path.join(request.directory,xOutputName(request,TITLE));
  await fs.writeFile(old,'previous file');
  await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='verification_failed');
  assert.equal(await fs.readFile(old,'utf8'),'previous file');
  // Another valid invocation can reuse a fresh directory so no failed-stage state collides.
  const good=await setup(t),req=good.request(['audio',URL,'--overwrite','yes']);
  await fs.mkdir(req.directory,{recursive:true});
  const dest=path.join(req.directory,xOutputName(req,TITLE));
  await fs.writeFile(dest,'existing');
  const result=await executeXRequest(req,good.ctx);
  assert.equal(result.file,dest);assert.equal(result.sha256,await hashFile(dest));
});
test('bad extractor, protected posts, escaped file paths and broken media cannot become success',options,async t=>{
  for(const [settings,expected] of [[{badPost:true},'verification_failed'],
    [{restricted:true},'access_restricted'],[{escape:true},'file_security'],
    [{corrupt:true},'verification_failed'],[{metadataError:'Could not authenticate you'},'access_restricted'],
    [{metadataError:'HTTP Error 429'},'access_restricted']]){
    const s=await setup(t,settings);
    await assert.rejects(()=>executeXRequest(s.request(['video',URL]),s.ctx),e=>e.status===expected);
    assert.ok(s.downloads()<=1);
    assert.ok(!s.calls.some(c=>c.args.includes('--cookies')||c.args.includes('--cookies-from-browser')));
  }
});
test('active lock rejects concurrent requests without concurrent writes',options,async t=>{
  let unblock,arrived;
  const gate=new Promise(resolve=>{unblock=resolve;}),entered=new Promise(resolve=>{arrived=resolve;});
  const s=await setup(t,{wait:async()=>{arrived();await gate;}}),request=s.request(['audio',URL]);
  const first=executeXRequest(request,s.ctx);await entered;
  await assert.rejects(()=>executeXRequest(request,s.ctx),e=>e.status==='locked');
  unblock();assert.equal((await first).status,'downloaded');
});
