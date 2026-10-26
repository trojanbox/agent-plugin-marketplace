#!/usr/bin/env node
/** Public X/Twitter single-post video/audio download, without authentication or Cookies. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { YoutubeError, classifyBackendFailure, safeDiagnostic, publicError } from './youtube-core.mjs';
import { parseXRequest, xIdentity, xKey, xOutputName, xMediaSelector, xPlan } from './x-core.mjs';
import { ensureDependencies } from './youtube-deps.mjs';
import { safeChildEnv } from './youtube.mjs';
import { runProcess, outputDirectory, safeDirectory, lstatOrNull, regularFile, acquireLock,
  readPrivateJson, writePrivateJson, inventory, publishFile, isWithin } from './youtube-io.mjs';
import { processMedia, verifyMedia } from './youtube-media.mjs';

export const HELP = `X/Twitter 公开单帖视频下载工具（JSON 结果）
  video URL [--format mp4|mkv] [--max-height 1080] [--dir ABS] [--overwrite yes|no] [--timeout 7200]
  audio URL [--format mp3|m4a] [--dir ABS] [--overwrite yes|no] [--timeout 7200]
  doctor    检查共用 yt-dlp / FFmpeg 依赖；不联网下载媒体
  repair    检查并安全修复缺失依赖；不下载媒体
示例：node x.mjs video 'https://x.com/user/status/1234567890123456789'
单帖多媒体请用帖子末尾 /video/1～4 明确选择；不批量下载，不支持图片/Spaces/登录/Cookie。
默认下载到当前执行用户 ~/Downloads/X；成品使用安全化帖子标题命名，默认不覆盖。
动画 GIF 视为无声 MP4。无声视频不能提取 MP3；不绕过 X 的访问限制。`;

export function backendArgs(deps) {
  const runtime = path.isAbsolute(deps.js.path) ? `${deps.js.type}:${deps.js.path}` : deps.js.type;
  const args = ['--ignore-config', '--no-plugin-dirs', '--no-remote-components', '--no-playlist',
    '--no-cache-dir', '--no-progress', '--no-colors', '--socket-timeout', '20', '--retries', '2',
    '--fragment-retries', '2', '--extractor-retries', '1', '--file-access-retries', '1',
    '--no-js-runtimes', '--js-runtimes', runtime];
  if (path.isAbsolute(deps.ffmpeg.path)) args.push('--ffmpeg-location', deps.ffmpeg.path);
  return args;
}
function failed(result, fallback = 'download_failed') {
  const message = String(result.stderr || result.stdout);
  if (/no video could be found|no video in (this|the) tweet|there is no video/iu.test(message)) {
    throw new YoutubeError('video_unavailable', '帖子没有可获取的视频或动图');
  }
  if (/could not authenticate|unauthori[sz]ed|authentication|required.*(login|log in)|protected account/iu.test(message)) {
    throw new YoutubeError('access_restricted', 'X 拒绝公开访问该帖子；不会使用登录或 Cookie 绕过');
  }
  throw new YoutubeError(classifyBackendFailure(message, fallback), 'X 下载失败：' + safeDiagnostic(message));
}
async function readMetadata(request, deps, runner, options) {
  const args = [...backendArgs(deps), '--skip-download', '--dump-single-json', '--format', xMediaSelector(request)];
  const result = await runner(deps.ytdlp.path, [...args, '--', request.url],
    { ...options, timeoutMs: Math.min(request.timeoutMs, 120000) });
  if (result.code !== 0) failed(result);
  let info;
  try { info = JSON.parse(result.stdout); }
  catch { throw new YoutubeError('verification_failed', 'X 下载器没有返回有效的媒体元数据'); }
  if (!info) throw new YoutubeError('video_unavailable', 'X 帖子没有可用媒体');
  return info;
}

/** Immutable request identity and bounded file-hash inventory gate safe recovery. */
export async function openXState(stage, request) {
  const stateFile = path.join(stage, 'state.json');
  if (!await lstatOrNull(stateFile)) {
    if ((await fs.readdir(stage)).length) throw new YoutubeError('resume_invalid', '存在未经校验的 X 下载残留文件');
    return null;
  }
  const state = await readPrivateJson(stateFile);
  if (state.schema !== 1 || JSON.stringify(state.request) !== JSON.stringify(xIdentity(request))
    || !state.plan || !state.files) throw new YoutubeError('resume_invalid', 'X 断点请求与当前操作不匹配');
  const actual = await inventory(stage, new Set(['state.json']));
  if (JSON.stringify(actual) !== JSON.stringify(state.files)) throw new YoutubeError('resume_invalid', 'X 断点文件已修改，不能安全恢复');
  return state;
}
async function checkpoint(stage, request, plan) {
  await writePrivateJson(path.join(stage, 'state.json'), { schema: 1, request: xIdentity(request), plan,
    files: await inventory(stage, new Set(['state.json'])) });
}
async function fetchMedia(request, deps, plan, stage, runner, options) {
  const args = [...backendArgs(deps), '--no-simulate', '--no-overwrites', '--continue',
    '--no-write-info-json', '--no-write-thumbnail', '--no-write-subs', '--no-write-auto-subs',
    '--output', 'raw.%(ext)s', '--format', plan.formats.map(f => f.id).join('+'),
    '--merge-output-format', 'mkv', '--print', 'after_move:%(filepath)j'];
  const result = await runner(deps.ytdlp.path, [...args, '--', request.url],
    { ...options, cwd: stage, timeoutMs: request.timeoutMs });
  if (result.code !== 0) failed(result);
  const paths = result.stdout.trim().split(/\r?\n/u).map(line => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(value => typeof value === 'string');
  if (paths.length !== 1) throw new YoutubeError('verification_failed', '下载器未返回唯一媒体文件路径');
  const file = path.resolve(stage, paths[0]);
  if (!isWithin(stage, file) || path.dirname(file) !== stage || !/^raw\.[A-Za-z0-9_-]+$/u.test(path.basename(file))) {
    throw new YoutubeError('file_security', 'X 下载器返回了目标目录以外或异常的文件名');
  }
  if (!await lstatOrNull(file)) throw new YoutubeError('verification_failed', '下载器报告的媒体文件实际不存在');
  await regularFile(file);
  return file;
}

export async function executeXRequest(request, context = {}) {
  const home = context.home || os.homedir();
  const env = context.env || process.env;
  const runner = context.runner || runProcess;
  const resolver = context.dependencyResolver || ensureDependencies;
  if (request.mode === 'help') return { ok: true, status: 'help', help: HELP };
  if (['doctor', 'repair'].includes(request.mode)) {
    const dependencies = await resolver({ home, env, checkOnly: request.mode === 'doctor', runner });
    return { ok: true, status: 'local_dependencies_ready', network_verified: false, dependencies };
  }
  const directory = await outputDirectory(request.directory, home);
  const stateRoot = await safeDirectory(path.join(directory, '.x-partials'), { privateLeaf: true });
  const key = xKey(request);
  const release = await acquireLock(path.join(stateRoot, key + '.lock'));
  let stage, plan, finalPath, mayCheckpoint = false, published = false;
  try {
    stage = await safeDirectory(path.join(stateRoot, key), { privateLeaf: true });
    const previous = await openXState(stage, request);
    const deps = await resolver({ home, env, runner });
    const options = { cwd: stage, signal: context.signal, env: safeChildEnv(env) };
    const info = await readMetadata(request, deps, runner, options);
    plan = xPlan(info, request);
    if (previous && JSON.stringify(previous.plan) !== JSON.stringify(plan)) {
      throw new YoutubeError('resume_invalid', 'X 媒体 ID 或格式已变化，拒绝将旧断点用于不同媒体流');
    }
    finalPath = path.join(directory, xOutputName(request, info.title));
    if (!request.overwrite && await lstatOrNull(finalPath)) {
      throw new YoutubeError('file_exists', '同名文件已存在，默认不覆盖', { existing_file: finalPath });
    }
    if (request.overwrite && await lstatOrNull(finalPath)) await regularFile(finalPath, { allowEmpty: true });
    mayCheckpoint = true;
    await checkpoint(stage, request, plan);
    const source = await fetchMedia(request, deps, plan, stage, runner, options);
    const prepared = path.join(stage, 'prepared.' + request.format);
    const mediaOptions = { runner: (bin, args, opts) => runner(bin, args, { ...options, ...opts }),
      signal: context.signal, allowSilentVideo: request.mode === 'video' };
    const processing = await processMedia(source, prepared, request, deps, mediaOptions);
    const verified = await verifyMedia(prepared, request, deps, plan.duration, mediaOptions);
    await publishFile(prepared, finalPath, request.overwrite);
    published = true;
    const result = { ok: true, status: 'downloaded', platform: 'x', mode: request.mode,
      post_id: request.postId, media_id: plan.mediaId, media_index: request.mediaIndex,
      file: finalPath, format: request.format, ...verified, ...processing,
      recovered: Boolean(previous && Object.keys(previous.files).length), untrusted: true };
    try { await fs.rm(stage, { recursive: true }); }
    catch { result.warning = '已保存并校验媒体，但清理中间文件失败'; }
    return result;
  } catch (error) {
    if (stage && plan && mayCheckpoint && !published) {
      try {
        await checkpoint(stage, request, plan);
        if (error instanceof YoutubeError) {
          error.details = { ...error.details, recovery_directory: stage, partial_files_preserved: true };
        }
      } catch {
        if (error instanceof YoutubeError) error.details = { ...error.details, recovery_directory: stage, resume_verified: false };
      }
    }
    throw error;
  } finally { await release(); }
}

export async function main(args = process.argv.slice(2)) {
  const controller = new AbortController();
  const interrupt = () => controller.abort();
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const result = await executeXRequest(parseXRequest(args), { signal: controller.signal });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify(publicError(error), null, 2) + '\n');
    process.exitCode = error.status === 'interrupted' ? 130 : 1;
  } finally { process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
