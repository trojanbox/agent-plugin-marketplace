import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { normalizeXUrl, parseXRequest, xIdentity, xKey, xMediaSelector,
  xOutputName, validateXMetadata, xPlan } from '../scripts/x-core.mjs';
import { YoutubeError } from '../scripts/youtube-core.mjs';
import { backendArgs, executeXRequest } from '../scripts/x.mjs';
const POST='2103382268051964103', MEDIA='2103381602994659329';
const URL=`https://x.com/jcarlos2001/status/${POST}`;
const invalid = status => e => e instanceof YoutubeError && e.status === status;
const info = () => ({ id:MEDIA, display_id:POST, extractor_key:'Twitter', age_limit:0,
  title:'开源世界：AI / 计算机？', duration:1.2,
  requested_formats:[{format_id:'hls-326',ext:'mp4',vcodec:'avc1',acodec:'none',height:180},
    {format_id:'hls-audio-128000-Audio',ext:'mp4',vcodec:'none',acodec:'aac'}] });

test('strict public post URL normalization accepts x/twitter variants and strips tracking', () => {
  const urls=[URL+'?s=20', URL+'/#ignored', URL.replace('x.com','twitter.com'),
    URL.replace('x.com','mobile.twitter.com')];
  for (const u of urls) {
    const actual=normalizeXUrl(u);
    assert.equal(actual.url,URL);
    assert.equal(actual.postId,POST);
    assert.equal(actual.mediaIndex,null);
  }
  assert.equal(normalizeXUrl(URL+'/video/2?utm_source=x').url,URL+'/video/2');
});
test('rejects untrusted URLs, credentials, HTTP, playlists and invalid media selectors', () => {
  for (const u of ['http://x.com/a/status/'+POST, 'https://evil.x.com/a/status/'+POST,
    'https://x.com.evil.test/a/status/'+POST, 'https://user:secret@x.com/a/status/'+POST,
    'file:///etc/passwd','https://x.com/a','https://x.com/a/status/abc',
    'https://x.com/a/status/'+POST+'/video/9','https://x.com/a/status/'+POST+'/photo/1',
    'https://x.com/i/spaces/xyz','https://x.com/search?q=test','https://t.co/ABCD']) {
    assert.throws(()=>normalizeXUrl(u),e=>e.status==='unsupported_url'||e.status==='invalid_input');
  }
});
test('parse modes, output defaults, Unicode path, timeout and Windows paths', () => {
  const video=parseXRequest(['video',URL],'/tmp/home');
  const audio=parseXRequest(['audio',URL],'/tmp/home');
  assert.equal(video.format,'mp4');assert.equal(video.maxHeight,1080);assert.equal(video.directory,'/tmp/home/Downloads/X');
  assert.equal(audio.format,'mp3');assert.equal(audio.maxHeight,null);
  assert.equal(parseXRequest(['audio',URL,'--format','m4a']).format,'m4a');
  const windows=parseXRequest(['video',URL,'--dir','D:\\中文\\X'],'D:\\home',path.win32);
  assert.equal(windows.directory,'D:\\中文\\X');
  assert.equal(parseXRequest(['video',URL,'--max-height','720']).maxHeight,720);
  assert.equal(parseXRequest(['audio',URL,'--timeout','60']).timeoutMs,60000);
  assert.deepEqual(parseXRequest([]),{mode:'help'});
});
test('rejects unexpected flags, invalid numbers, cookies and extra commands', () => {
  for(const args of [['video',URL,'--cookies','file'],['video',URL,'--format','gif'],
    ['video',URL,'--format','mp3'],['audio',URL,'--format','mp4'],['audio',URL,'--max-height','720'],
    ['video',URL,'--max-height','100'],['video',URL,'--timeout','0'],
    ['video',URL,'--overwrite','true'],['video',URL,'--dir','relative'],
    ['video',URL,'--format','mkv','--format','mp4'],['doctor','--timeout','60']]){
    assert.throws(()=>parseXRequest(args),invalid('invalid_input'));
  }
});
test('output names carry safe human title, not random ID, with distinct index and format', () => {
  const v=parseXRequest(['video',URL]),a=parseXRequest(['audio',URL]);
  assert.equal(xOutputName(v,'开源世界：AI / 计算机？'),'开源世界：AI 计算机？.h1080.mp4');
  assert.equal(xOutputName(a,'开源世界：AI / 计算机？'),'开源世界：AI 计算机？.mp3');
  assert.equal(xOutputName(v,''),'X-'+POST+'.h1080.mp4');
  assert.match(xOutputName(parseXRequest(['video',URL+'/video/2']),'Media'),/^Media\.video2\.h1080\.mp4$/u);
  assert.equal(xKey(v),xKey(parseXRequest(['video',URL,'--timeout','30','--overwrite','yes'])));
  assert.notEqual(xKey(v),xKey(a));
  assert.notEqual(xKey(v),xKey(parseXRequest(['video',URL+'/video/2'])));
  assert.deepEqual(xIdentity(v).postId,POST);
});
test('format cap and URL metadata are separate; Twitter media ID differs from post ID', () => {
  const v=parseXRequest(['video',URL]),a=parseXRequest(['audio',URL]);
  const data=info(); validateXMetadata(data,v);
  assert.equal(xPlan(data,v).mediaId,MEDIA);
  assert.equal(xPlan(data,v).formats.length,2);
  assert.equal(xMediaSelector(a),'bestaudio/best');
  assert.match(xMediaSelector(v),/1080/u);
  assert.throws(()=>xPlan({...data,display_id:'123456'},v),invalid('verification_failed'));
  assert.throws(()=>xPlan({...data,extractor_key:'Youtube'},v),invalid('verification_failed'));
  assert.throws(()=>xPlan({...data,entries:[data],_type:'playlist'},v),invalid('multiple_media_unsupported'));
  assert.throws(()=>xPlan({...data,age_limit:18},v),invalid('access_restricted'));
  assert.throws(()=>xPlan({...data,is_live:true},v),invalid('video_unavailable'));
});
test('DRM and video over max-height rejected; absent audio rejected for extraction', () => {
  const data=info(), v=parseXRequest(['video',URL,'--max-height','144']);
  assert.throws(()=>xPlan(data,v),invalid('video_unavailable'));
  assert.throws(()=>xPlan({...data,requested_formats:[{...data.requested_formats[0],has_drm:true}]},v),invalid('video_unavailable'));
  const a=parseXRequest(['audio',URL]);
  assert.throws(()=>xPlan({...data,requested_formats:[data.requested_formats[0]]},a),invalid('video_unavailable'));
});
test('X downloader blocks inherited yt-dlp config, plugins, cookies, remote components', () => {
  const argv=backendArgs({ffmpeg:{path:'/tmp/bin/ffmpeg'},js:{path:'/tmp/node',type:'node'}});
  for(const flag of ['--ignore-config','--no-plugin-dirs','--no-remote-components',
    '--no-playlist','--no-js-runtimes']) assert.ok(argv.includes(flag));
  assert.ok(!argv.includes('--cookies'));
  assert.ok(!argv.includes('--cookies-from-browser'));
  assert.ok(!argv.includes('--extractor-args'));
});
test('doctor is read-only and repair dispatches only to the verified dependency resolver', async () => {
  const calls=[];
  const dependencyResolver=async args=>{calls.push(args.checkOnly);return {verified:true};};
  for(const [mode,checkOnly] of [['doctor',true],['repair',false]]) {
    const result=await executeXRequest(parseXRequest([mode]),{dependencyResolver});
    assert.equal(result.status,'local_dependencies_ready');
    assert.equal(result.network_verified,false);
    assert.equal(result.dependencies.verified,true);
    assert.equal(calls.at(-1),checkOnly);
  }
});
