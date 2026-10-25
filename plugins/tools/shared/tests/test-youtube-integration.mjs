/** Offline downloader-double integration with REAL FFmpeg/ffprobe and filesystem operations.
 * Set YOUTUBE_TEST_FFMPEG / YOUTUBE_TEST_FFPROBE to a verified installed pair.
 * No QQ account, YouTube login, cookies or network access is needed by these tests.
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runProcess, hashFile } from '../scripts/youtube-io.mjs';
import { executeRequest } from '../scripts/youtube.mjs';
import { parseRequest, requestKey, outputName } from '../scripts/youtube-core.mjs';
import { verifyMedia, verifySubtitle } from '../scripts/youtube-media.mjs';

const ffmpeg = process.env.YOUTUBE_TEST_FFMPEG || 'ffmpeg';
const ffprobe = process.env.YOUTUBE_TEST_FFPROBE || 'ffprobe';
const available = spawnSync(ffmpeg,['-version'],{stdio:'ignore'}).status===0 && spawnSync(ffprobe,['-version'],{stdio:'ignore'}).status===0;
const opt={skip:available?false:'Real FFmpeg/ffprobe not available; set YOUTUBE_TEST_FFMPEG and YOUTUBE_TEST_FFPROBE'};
const ID='BaW_jenozKc',URL=`https://www.youtube.com/watch?v=${ID}`;
const VTT='WEBVTT\n\n00:00.000 --> 00:00.500\n第一句 hello\n\n00:00.500 --> 00:01.000\n第二句 world\n';
const deps={ytdlp:{path:'/fixture/yt-dlp',source:'managed'},ffmpeg:{path:ffmpeg},ffprobe:{path:ffprobe},js:{type:'node',path:process.execPath}};
let root, webm, mp4;
before(async()=>{
  if(!available)return;
  root=await fs.mkdtemp(path.join(os.tmpdir(),'youtube-media-fixtures-'));webm=path.join(root,'source.webm');mp4=path.join(root,'source.mp4');
  const base=['-nostdin','-v','error','-y','-f','lavfi','-i','testsrc2=size=320x180:rate=10','-f','lavfi','-i','sine=frequency=440:sample_rate=48000','-t','1.2'];
  for(const [file,enc] of [[webm,['-c:v','libvpx','-b:v','200k','-c:a','libopus']],[mp4,['-c:v','libx264','-preset','ultrafast','-c:a','aac']]]){
    const r=await runProcess(ffmpeg,[...base,...enc,'-threads','1',file]);assert.equal(r.code,0,r.stderr);
  }
});
after(async()=>{if(root)await fs.rm(root,{recursive:true,force:true});});

async function context(t,settings={}){
  const home=await fs.mkdtemp(path.join(os.tmpdir(),'youtube-workflow-'));
  t.after(()=>fs.rm(home,{recursive:true,force:true}));
  const calls=[];let downloads=0,metadataCount=0;
  const runner=async(bin,args,options)=>{
    calls.push({bin,args});
    if(bin!==deps.ytdlp.path)return await runProcess(bin,args,options);
    if(args.includes('--dump-single-json')){
      metadataCount++;
      if(settings.metadataError)return{code:1,stdout:'',stderr:settings.metadataError};
      const info={id:ID,extractor_key:'Youtube',availability:'public',duration:1.2,
        format_id:settings.changePlan&&metadataCount>1?'changed':'fixture',height:180,vcodec:settings.mp4?'h264':'vp8',acodec:settings.mp4?'aac':'opus',ext:settings.mp4?'mp4':'webm',
        subtitles:settings.noCaptions||settings.auto?{}:{'zh-Hans':[{ext:'vtt',url:'https://www.youtube.com/api/timedtext?lang=zh-Hans'}]},
        automatic_captions:settings.auto?{'zh-orig':[{ext:'vtt',url:'https://www.youtube.com/api/timedtext?lang=zh&kind=asr'}]}:{}};
      return{code:0,stdout:JSON.stringify(info),stderr:''};
    }
    downloads++;
    if(settings.wait)await settings.wait();
    if(settings.interruptOnce&&downloads===1){
      await fs.writeFile(path.join(options.cwd,'raw.webm.part'),'verified partial fixture');
      return{code:1,stdout:'',stderr:'Connection reset during download'};
    }
    if(settings.outside)return{code:0,stdout:JSON.stringify(path.join(home,'unrelated.mp4'))+'\n',stderr:''};
    if(settings.missing)return{code:0,stdout:JSON.stringify(path.join(options.cwd,'raw.webm'))+'\n',stderr:''};
    if(args.includes('--skip-download')){
      const code=args[args.indexOf('--sub-langs')+1].replace(/^\^|\$$/gu,'');
      await fs.writeFile(path.join(options.cwd,`raw.${code}.vtt`),settings.corrupt?'not captions':VTT);
      return{code:0,stdout:'',stderr:''};
    }
    const name=settings.mp4?'raw.mp4':'raw.webm',file=path.join(options.cwd,name);
    if(settings.corrupt)await fs.writeFile(file,'not media');else await fs.copyFile(settings.mp4?mp4:webm,file);
    await fs.rm(path.join(options.cwd,'raw.webm.part'),{force:true});
    return{code:0,stdout:JSON.stringify(file)+'\n',stderr:''};
  };
  const ctx={home,env:{HOME:home,PATH:process.env.PATH},runner,dependencyResolver:async()=>deps};
  return {home,calls,ctx,request:args=>parseRequest(args,home),downloadCount:()=>downloads};
}

for(const format of ['mp4','mkv'])test(`real video ${format}: streams, container, resolution, digest, no-overwrite and metadata`,opt,async t=>{
  const s=await context(t);const request=s.request(['video',URL,'--format',format]);
  const result=await executeRequest(request,s.ctx);
  assert.equal(result.ok,true);assert.equal(result.status,'downloaded');assert.equal(result.height,180);assert.equal(result.format,format);
  assert.equal(result.sha256,await hashFile(result.file));assert.equal(result.transcoded,format==='mp4');
  assert.equal(result.audio_codec,format==='mp4'?'aac':'opus');
  assert.equal(s.calls.filter(c=>c.bin===deps.ytdlp.path).length,2);
  assert.ok(s.calls.find(c=>c.args.includes('--dump-single-json')).args.includes('bv*[height<=1080]+ba/b[height<=1080]'));
  const before=await hashFile(result.file);await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='file_exists');
  assert.equal(await hashFile(result.file),before);assert.equal(s.downloadCount(),1);
});
test('compatible MP4 is actually stream-copied instead of needlessly transcoded',opt,async t=>{
  const s=await context(t,{mp4:true});const result=await executeRequest(s.request(['video',URL]),s.ctx);
  assert.equal(result.transcoded,false);assert.equal(result.video_codec,'h264');
});
for(const format of ['mp3','m4a'])test(`real audio ${format}: conversion, no video stream, duration and digest`,opt,async t=>{
  const s=await context(t);const result=await executeRequest(s.request(['audio',URL,'--format',format]),s.ctx);
  assert.equal(result.format,format);assert.equal(result.audio_codec,format==='mp3'?'mp3':'aac');assert.equal(result.height,undefined);
  assert.equal(result.transcoded,true);assert.equal(result.sha256,await hashFile(result.file));
});
for(const format of ['srt','vtt'])test(`real subtitles ${format}: selected native language and valid cue conversion`,opt,async t=>{
  const s=await context(t);const result=await executeRequest(s.request(['subtitles',URL,'--format',format]),s.ctx);
  assert.equal(result.language,'zh-Hans');assert.equal(result.requested_language,'zh');assert.equal(result.subtitle_source,'manual');
  assert.ok((await fs.readFile(result.file,'utf8')).includes('第一句'));
  await verifySubtitle(result.file,format);
  const request=s.calls.find(c=>c.args.includes('--sub-langs'));
  assert.ok(request.args.includes('--write-subs'));assert.ok(request.args.includes('--no-write-auto-subs'));
});
test('native automatic captions are selected only after the requested-language manual captions are absent',opt,async t=>{
  const s=await context(t,{auto:true});const result=await executeRequest(s.request(['subtitles',URL]),s.ctx);
  assert.equal(result.subtitle_source,'automatic');assert.equal(result.language,'zh');
  const call=s.calls.find(c=>c.args.includes('--sub-langs'));assert.ok(call.args.includes('--write-auto-subs'));assert.ok(call.args.includes('--no-write-subs'));
});
test('missing requested captions stops before media bytes are fetched, without language fallback',opt,async t=>{
  const s=await context(t,{noCaptions:true});await assert.rejects(()=>executeRequest(s.request(['subtitles',URL]),s.ctx),e=>e.status==='subtitle_unavailable');assert.equal(s.downloadCount(),0);
});
test('network interruption writes a checksum-bound recovery state and second attempt safely resumes',opt,async t=>{
  const s=await context(t,{interruptOnce:true});const request=s.request(['video',URL]);
  await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='network_error'&&e.details.partial_files_preserved);
  const stage=path.join(request.directory,'.youtube-partials',requestKey(request));
  const state=JSON.parse(await fs.readFile(path.join(stage,'state.json'),'utf8'));
  assert.ok(state.files['raw.webm.part'].sha256);assert.equal(state.plan.formats[0].id,'fixture');
  const result=await executeRequest(request,s.ctx);assert.equal(result.recovered,true);assert.equal(s.downloadCount(),2);
  await assert.rejects(()=>fs.stat(stage),{code:'ENOENT'});
});
test('tampered partial files and changed source stream selections are rejected before resuming',opt,async t=>{
  for(const alter of ['bytes','plan']){
    const s=await context(t,{interruptOnce:true,changePlan:alter==='plan'});const request=s.request(['video',URL]);
    await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='network_error');
    if(alter==='bytes')await fs.writeFile(path.join(request.directory,'.youtube-partials',requestKey(request),'raw.webm.part'),'tampered');
    await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='resume_invalid');assert.equal(s.downloadCount(),1);
  }
});
test('failed overwrite keeps the old completed file intact until new output is verified',opt,async t=>{
  const s=await context(t,{corrupt:true});const request=s.request(['video',URL,'--overwrite','yes']);
  await fs.mkdir(request.directory,{recursive:true});const old=path.join(request.directory,outputName(request));await fs.writeFile(old,'old data');
  await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='verification_failed');assert.equal(await fs.readFile(old,'utf8'),'old data');
});
test('successful explicit overwrite replaces only the selected completed target',opt,async t=>{
  const s=await context(t);const request=s.request(['audio',URL,'--overwrite','yes']);
  await fs.mkdir(request.directory,{recursive:true});const old=path.join(request.directory,outputName(request));await fs.writeFile(old,'old data');
  const result=await executeRequest(request,s.ctx);assert.equal(result.file,old);assert.equal(result.sha256,await hashFile(old));
});
test('corrupt captions, escaped backend paths and claimed non-existent files cannot become successes',opt,async t=>{
  for(const [settings,mode,expected] of [[{corrupt:true},'subtitles','verification_failed'],[{outside:true},'video','file_security'],[{missing:true},'video','verification_failed']]){
    const s=await context(t,settings);const request=s.request([mode,URL]);await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status===expected);
    await assert.rejects(()=>fs.stat(path.join(request.directory,outputName(request))),{code:'ENOENT'});
  }
});
test('access restriction is final and is not retried with cookies or authentication',opt,async t=>{
  const s=await context(t,{metadataError:'Sign in to confirm you are not a bot'});
  await assert.rejects(()=>executeRequest(s.request(['video',URL]),s.ctx),e=>e.status==='access_restricted');assert.equal(s.calls.length,1);assert.equal(s.downloadCount(),0);
});
test('concurrent request for the same output is blocked while the first request owns its lock',opt,async t=>{
  let unblock,started;const gate=new Promise(resolve=>{unblock=resolve;}),entered=new Promise(resolve=>{started=resolve;});
  const s=await context(t,{wait:async()=>{started();await gate;}}),request=s.request(['audio',URL]);
  const first=executeRequest(request,s.ctx);await entered;
  await assert.rejects(()=>executeRequest(request,s.ctx),e=>e.status==='locked');unblock();assert.equal((await first).ok,true);
});
test('verification rejects valid media if the duration or requested height contract does not match',opt,async t=>{
  const s=await context(t,{mp4:true}),request=s.request(['video',URL]);
  await assert.rejects(()=>verifyMedia(mp4,request,deps,500),e=>e.status==='verification_failed');
  await assert.rejects(()=>verifyMedia(mp4,{...request,maxHeight:144},deps,1.2),e=>e.status==='verification_failed');
});
