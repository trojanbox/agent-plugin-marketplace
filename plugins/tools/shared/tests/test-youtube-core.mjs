import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { normalizeUrl, parseRequest, normalizeLanguage, selectSubtitle, validateMetadata,
  selectedFormats, requestKey, requestIdentity, outputName, mediaSelector, classifyBackendFailure,
  safeDiagnostic, publicError, YoutubeError } from '../scripts/youtube-core.mjs';
import { backendArgs, safeChildEnv } from '../scripts/youtube.mjs';

const ID = 'BaW_jenozKc', URL = `https://www.youtube.com/watch?v=${ID}`;
const track = (lang = 'zh-Hans', translated = false) => [{ ext: 'vtt', url: `https://www.youtube.com/api/timedtext?lang=${lang}${translated ? '&tlang=zh' : ''}` }];
const status = expected => error => error instanceof YoutubeError && error.status === expected;

test('normalizes canonical, short, mobile, shorts, embed and playlist-context watch URLs to one video', () => {
  for (const u of [URL, `https://youtu.be/${ID}?si=xxx`, `https://m.youtube.com/watch?v=${ID}`, `https://www.youtube.com/shorts/${ID}`,
    `https://youtube.com/embed/${ID}`, `${URL}&list=PL-example&t=42`]) assert.deepEqual(normalizeUrl(u), { id: ID, url: URL });
});
test('rejects playlist-only, channels, non-YouTube, credentials, non-HTTPS, malformed and duplicate v URLs', () => {
  for (const u of ['https://youtube.com/playlist?list=PL123', 'https://youtube.com/@foo', `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://attacker@youtube.com/watch?v=${ID}`, `http://youtu.be/${ID}`, `${URL}&v=${ID}`, 'https://youtu.be/../../etc/passwd', 'file:///etc/passwd', 'data:text/plain,x']) {
    assert.throws(() => normalizeUrl(u), status('unsupported_url'));
  }
  assert.throws(() => normalizeUrl('not a url'), status('invalid_input'));
});
test('all defaults reproduce frozen user choices', () => {
  const v = parseRequest(['video', URL], '/home/test');
  assert.equal(v.format, 'mp4'); assert.equal(v.maxHeight, 1080); assert.equal(v.overwrite, false);
  assert.equal(v.directory, '/home/test/Downloads/YouTube'); assert.equal(v.timeoutMs, 7200000);
  assert.equal(parseRequest(['audio', URL]).format, 'mp3');
  const s = parseRequest(['subtitles', URL]); assert.equal(s.language, 'zh'); assert.equal(s.format, 'srt');
});
test('explicit supported variants, Unicode paths and Windows paths are preserved safely', () => {
  const r = parseRequest(['video', URL, '--format', 'mkv', '--max-height', '2160', '--dir', '/tmp/中文 path', '--overwrite', 'yes']);
  assert.equal(r.maxHeight, 2160); assert.equal(r.format, 'mkv'); assert.equal(r.overwrite, true);
  const w = parseRequest(['audio', URL, '--format', 'm4a'], 'D:\\用户 名', path.win32);
  assert.equal(w.directory, 'D:\\用户 名\\Downloads\\YouTube');
  assert.equal(parseRequest(['subtitles', URL, '--lang', '日文', '--format', 'vtt']).language, 'ja');
});
test('rejects arbitrary flags, scripts, cookies, duplicates, format mismatch and bad numbers', () => {
  const invalid = [ ['--exec','evil'],['--cookies','cookies.txt'],['--format','avi'],['--format','mp4','--format','mkv'],['--dir','relative'],
    ['--max-height','0'],['--max-height','1080;rm'],['--max-height','20000'],['--timeout','0'],['--overwrite','maybe'],['--lang','en'],['--format'] ];
  for (const flags of invalid) assert.throws(() => parseRequest(['video', URL, ...flags]), status('invalid_input'));
  assert.throws(() => parseRequest(['subtitles', URL, '--lang', 'en,ja']), status('invalid_input'));
  assert.throws(() => parseRequest(['audio', URL, '--format', 'mp4']), status('invalid_input'));
  assert.throws(() => parseRequest(['doctor','--format','mp3']), status('invalid_input'));
  assert.deepEqual(parseRequest([]), { mode: 'help' });
});
test('task identities distinguish media, height, language and format, but not retry timeout/overwrite', () => {
  const a = parseRequest(['video', URL]); const b = parseRequest(['video', URL, '--overwrite', 'yes', '--timeout','30']);
  assert.equal(requestKey(a), requestKey(b)); assert.deepEqual(requestIdentity(a), requestIdentity(b));
  assert.notEqual(requestKey(a), requestKey(parseRequest(['video',URL,'--max-height','720'])));
  assert.notEqual(outputName(a), outputName(parseRequest(['audio',URL])));
  assert.match(outputName(parseRequest(['subtitles',URL])), /^BaW_jenozKc\.subtitles\.zh\.srt$/u);
});
test('height is a strict selection cap; audio selection always requests an audio-bearing resource', () => {
  assert.equal(mediaSelector(parseRequest(['video',URL])), 'bv*[height<=1080]+ba/b[height<=1080]');
  assert.equal(mediaSelector(parseRequest(['audio',URL])), 'bestaudio/best');
});
test('Chinese language aliases preserve explicit script/region intent', () => {
  assert.equal(normalizeLanguage('中文'),'zh'); assert.equal(normalizeLanguage('简体中文'),'zh-Hans');
  assert.equal(normalizeLanguage('ZH-tw'),'zh-TW'); assert.equal(normalizeLanguage('en-us'),'en-US');
  for (const x of ['.*', '../zh','zh,en','--exec','z']) assert.throws(() => normalizeLanguage(x), status('invalid_input'));
});
test('manual selected-language captions win over native automatic captions', () => {
  const s = selectSubtitle({ subtitles: {'zh-Hant': track('zh-Hant')}, automatic_captions: {zh: track()} });
  assert.equal(s.source,'manual'); assert.equal(s.code,'zh-Hant');
});
test('same-language ASR is a valid fallback; unrelated manual language is never a fallback', () => {
  const s=selectSubtitle({subtitles:{en:track('en')},automatic_captions:{'zh-orig':track('zh')}});
  assert.equal(s.source,'automatic');assert.equal(s.code,'zh-orig');assert.equal(s.language,'zh');
  assert.throws(()=>selectSubtitle({subtitles:{en:track('en')},automatic_captions:{ja:track('ja')}}),status('subtitle_unavailable'));
});
test('translated captions are not accepted as native Chinese, even if named zh', () => {
  assert.throws(()=>selectSubtitle({automatic_captions:{zh:track('en',true)}}),status('subtitle_unavailable'));
  assert.throws(()=>selectSubtitle({automatic_captions:{zh:[{ext:'vtt',url:'http://example.com/caption'}]}}),status('subtitle_unavailable'));
});
test('explicit zh-Hans accepts equivalent zh-CN but never substitutes Traditional Chinese', () => {
  assert.equal(selectSubtitle({subtitles:{'zh-CN':track('zh-CN')}},'zh-Hans').language,'zh-CN');
  assert.throws(()=>selectSubtitle({subtitles:{'zh-Hant':track('zh-Hant')}},'zh-Hans'),status('subtitle_unavailable'));
});
test('empty subtitle tracks, non-VTT sources and malicious subtitle codes are refused', () => {
  for(const info of [{},{subtitles:{zh:[]}},{subtitles:{zh:[{ext:'json3',url:'https://youtube.com/caption'}]}},
    {subtitles:{'zh-../../escape':track()}},{subtitles:{zh:[{ext:'vtt',url:'https://user:pass@youtube.com/caption'}]}}]) {
    assert.throws(()=>selectSubtitle(info),status('subtitle_unavailable'));
  }
});
test('metadata must describe the requested video, not a playlist, live stream or restricted resource', () => {
  validateMetadata({id:ID,extractor_key:'Youtube',availability:'public'},ID);
  validateMetadata({id:ID,availability:'unlisted'},ID);
  for(const info of [{id:'other'},{id:ID,entries:[]},{id:ID,_type:'playlist'}]) assert.throws(()=>validateMetadata(info,ID),status('verification_failed'));
  for(const availability of ['private','premium_only','subscriber_only','needs_auth']) assert.throws(()=>validateMetadata({id:ID,availability},ID),status('access_restricted'));
  assert.throws(()=>validateMetadata({id:ID,age_limit:18},ID),status('access_restricted'));
  assert.throws(()=>validateMetadata({id:ID,is_live:true},ID),status('video_unavailable'));
});
test('selected stream plans bind concrete format IDs and prove audio and height before download', () => {
  const request=parseRequest(['video',URL]);
  const formats=[{format_id:'137',height:1080,vcodec:'h264',acodec:'none',ext:'mp4'},{format_id:'140',vcodec:'none',acodec:'aac',ext:'m4a'}];
  assert.deepEqual(selectedFormats({requested_formats:formats},request).map(f=>f.id),['137','140']);
  assert.throws(()=>selectedFormats({requested_formats:[formats[0]]},request),status('video_unavailable'));
  assert.throws(()=>selectedFormats({requested_formats:[{...formats[0],height:2160},formats[1]]},request),status('verification_failed'));
  assert.throws(()=>selectedFormats({requested_formats:[{...formats[0],format_id:'137;evil'},formats[1]]},request),status('video_unavailable'));
});
test('backend failures are typed without leaking signed URLs or authorization data', () => {
  assert.equal(classifyBackendFailure('Sign in to confirm you are not a bot'),'access_restricted');
  assert.equal(classifyBackendFailure('HTTP Error 429'),'access_restricted');
  assert.equal(classifyBackendFailure('Connection timed out'),'network_error');
  assert.equal(classifyBackendFailure('Video unavailable'),'video_unavailable');
  assert.equal(classifyBackendFailure('unknown'),'download_failed');
  const s=safeDiagnostic('cookie=secret https://example.com/file?sig=PRIVATE');
  assert.ok(!s.includes('secret')&&!s.includes('PRIVATE'));assert.equal(publicError(new YoutubeError('x','y')).status,'x');
});
test('downloader ignores ambient configuration/plugins and does not fetch remote JS components', () => {
  const args=backendArgs({ffmpeg:{path:'/tmp/bin/ffmpeg'},js:{path:'/tmp/bin/deno',type:'deno'}});
  for(const flag of ['--ignore-config','--no-plugin-dirs','--no-remote-components','--no-playlist','--no-js-runtimes'])assert.ok(args.includes(flag));
  assert.ok(args.includes('youtube:skip=translated_subs'));
  assert.ok(args.includes('deno:/tmp/bin/deno'));
  const e=safeChildEnv({HOME:'/tmp/home',PATH:'/bin',OPENAI_API_KEY:'never-forward',NODE_OPTIONS:'--import unsafe',DENO_AUTH_TOKENS:'hidden'});
  assert.deepEqual(e,{HOME:'/tmp/home',PATH:'/bin'});
});
