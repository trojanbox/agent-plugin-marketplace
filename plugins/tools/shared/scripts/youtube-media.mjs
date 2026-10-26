/** Local FFmpeg/ffprobe processing. Output is private until all checks succeed. */
import * as fs from 'node:fs/promises';
import { YoutubeError, safeDiagnostic } from './youtube-core.mjs';
import { runProcess, regularFile, hashFile } from './youtube-io.mjs';

export async function probeMedia(file, deps, options = {}) {
  await regularFile(file);
  const run = options.runner || runProcess;
  const result = await run(deps.ffprobe.path, ['-v', 'error', '-protocol_whitelist', 'file,pipe',
    '-show_format', '-show_streams', '-of', 'json', file], { timeoutMs: 60000, signal: options.signal });
  if (result.code !== 0) throw new YoutubeError('verification_failed', 'ffprobe 无法读取媒体文件：' + safeDiagnostic(result.stderr));
  let data;
  try { data = JSON.parse(result.stdout); } catch { throw new YoutubeError('verification_failed', 'ffprobe 未返回有效 JSON'); }
  if (!Array.isArray(data.streams) || !data.format) throw new YoutubeError('verification_failed', '媒体流信息缺失');
  return data;
}

export async function processMedia(source, target, request, deps, options = {}) {
  const run = options.runner || runProcess;
  const data = await probeMedia(source, deps, options);
  const video = data.streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const audio = data.streams.find(s => s.codec_type === 'audio');
  if (!audio && !(request.mode === 'video' && options.allowSilentVideo === true)) {
    throw new YoutubeError('verification_failed', '下载媒体没有正常音轨');
  }
  if (request.mode === 'video' && (!video || !video.height || video.height > request.maxHeight)) {
    throw new YoutubeError('verification_failed', '实际视频分辨率缺失或超出请求上限');
  }
  const common = ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-protocol_whitelist', 'file,pipe', '-i', source];
  let args, transcoded = false;
  if (request.mode === 'audio') {
    const canCopy = request.format === 'mp3' ? audio.codec_name === 'mp3' : ['aac', 'alac'].includes(audio.codec_name);
    transcoded = !canCopy;
    args = [...common, '-map', '0:a:0', '-vn', '-map_metadata', '-1', '-c:a', canCopy ? 'copy' : request.format === 'mp3' ? 'libmp3lame' : 'aac'];
    if (!canCopy) args.push(...(request.format === 'mp3' ? ['-q:a', '2'] : ['-b:a', '192k']));
    if (request.format === 'm4a') args.push('-movflags', '+faststart');
  } else {
    // Let the actual muxer determine compatibility; avoid needless quality loss based on a codec guess.
    transcoded = false;
    args = [...common, '-map', '0:v:0', ...(audio ? ['-map', '0:a:0'] : []), '-map_metadata', '-1'];
    args.push('-c', 'copy');
    if (request.format === 'mp4') args.push('-movflags', '+faststart');
  }
  args.push(target);
  let result = await run(deps.ffmpeg.path, args, { timeoutMs: request.timeoutMs, signal: options.signal });
  // One justified retry, only for an explicit muxer/codec incompatibility. Not for I/O or resource errors.
  if (result.code !== 0 && request.mode === 'video' && !transcoded
    && /not.*supported.*container|could not find tag|codec.*not supported|muxer does not support/iu.test(result.stderr)) {
    await fs.rm(target, { force: true });
    transcoded = true;
    const transcode = [...common, '-map', '0:v:0', ...(audio ? ['-map', '0:a:0'] : []), '-map_metadata', '-1',
      '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-pix_fmt', 'yuv420p',
      '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'];
    if (audio) transcode.push('-c:a', 'aac', '-b:a', '192k');
    if (request.format === 'mp4') transcode.push('-movflags', '+faststart');
    result = await run(deps.ffmpeg.path, [...transcode, target], { timeoutMs: request.timeoutMs, signal: options.signal });
  }
  if (result.code !== 0) throw new YoutubeError('conversion_failed', '音视频处理失败：' + safeDiagnostic(result.stderr));
  await fs.chmod(target, 0o600);
  return { transcoded };
}

export async function processSubtitle(source, target, format, deps, options = {}) {
  // Reject invalid native captions before a permissive muxer can emit an empty success.
  await verifySubtitle(source, 'vtt');
  if (format === 'vtt') await fs.copyFile(source, target);
  else {
    const run = options.runner || runProcess;
    const result = await run(deps.ffmpeg.path, ['-nostdin', '-hide_banner', '-loglevel', 'error', '-y',
      '-protocol_whitelist', 'file,pipe', '-f', 'webvtt', '-i', source, '-f', 'srt', target],
    { timeoutMs: 120000, signal: options.signal });
    if (result.code !== 0) throw new YoutubeError('conversion_failed', '字幕转换失败：' + safeDiagnostic(result.stderr));
  }
  await fs.chmod(target, 0o600);
}

export async function verifySubtitle(file, format) {
  const stat = await regularFile(file, { allowEmpty: true });
  if (stat.size === 0) throw new YoutubeError('verification_failed', '字幕文件为空');
  if (stat.size > 32 * 1024 * 1024) throw new YoutubeError('verification_failed', '字幕超过允许大小');
  const text = await fs.readFile(file, 'utf8');
  const timing = format === 'srt' ? /\d{2,}:\d{2}:\d{2},\d{3} --> \d{2,}:\d{2}:\d{2},\d{3}/u
    : /(?:\d{2,}:)?\d{2}:\d{2}\.\d{3} --> (?:\d{2,}:)?\d{2}:\d{2}\.\d{3}/u;
  if ((format === 'vtt' && !/^\uFEFF?WEBVTT(?:[ \t\r\n]|$)/u.test(text)) || !timing.test(text)) {
    throw new YoutubeError('verification_failed', '字幕内容为空或与请求的 SRT/VTT 格式不一致');
  }
  return { size: stat.size, sha256: await hashFile(file) };
}

export async function verifyMedia(file, request, deps, expectedDuration, options = {}) {
  const data = await probeMedia(file, deps, options);
  const video = data.streams.find(s => s.codec_type === 'video' && !s.disposition?.attached_pic);
  const audio = data.streams.find(s => s.codec_type === 'audio');
  const containers = String(data.format.format_name).split(',');
  const validFormat = request.format === 'mkv' ? containers.includes('matroska')
    : request.format === 'mp3' ? containers.includes('mp3') && audio?.codec_name === 'mp3'
    : containers.includes('mp4');
  if (!validFormat || (!audio && !(request.mode === 'video' && options.allowSilentVideo === true))
    || (request.mode === 'audio' && video)) throw new YoutubeError('verification_failed', '最终媒体容器/音轨不符合请求');
  if (request.format === 'mkv') {
    const f = await fs.open(file, 'r');
    const header = Buffer.alloc(256);
    try { await f.read(header, 0, header.length, 0); } finally { await f.close(); }
    if (!header.includes(Buffer.from('matroska'))) throw new YoutubeError('verification_failed', '文件不是实际 Matroska 容器');
  }
  if (request.format === 'm4a' && !['aac', 'alac'].includes(audio.codec_name)) throw new YoutubeError('verification_failed', 'M4A 音轨编码不匹配');
  if (request.mode === 'video' && (!video || !video.height || video.height > request.maxHeight)) throw new YoutubeError('verification_failed', '最终视频分辨率未知或超出上限');
  const duration = Number(data.format.duration || audio?.duration || video?.duration);
  if (!(duration > 0) || (Number.isFinite(expectedDuration) && expectedDuration > 0
    && Math.abs(duration - expectedDuration) > Math.max(1, expectedDuration * 0.03))) {
    throw new YoutubeError('verification_failed', '最终媒体时长无效或与源视频明显不一致，可能下载不完整');
  }
  const run = options.runner || runProcess;
  const decoded = await run(deps.ffmpeg.path, ['-nostdin', '-v', 'error', '-xerror', '-protocol_whitelist', 'file,pipe',
    '-i', file, ...(audio ? ['-map', '0:a:0'] : []), ...(request.mode === 'video' ? ['-map', '0:v:0'] : []), '-f', 'null', '-'],
  { timeoutMs: request.timeoutMs, signal: options.signal });
  if (decoded.code !== 0) throw new YoutubeError('verification_failed', '最终媒体解码校验失败：' + safeDiagnostic(decoded.stderr));
  return { size: (await regularFile(file)).size, sha256: await hashFile(file), duration,
    ...(video ? { width: video.width, height: video.height, video_codec: video.codec_name } : {}), audio_codec: audio?.codec_name || null };
}
