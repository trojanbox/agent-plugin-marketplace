#!/usr/bin/env node
/** YouTube single-video CLI. Authority: project-documents #295 / #294. */
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { YoutubeError, parseRequest, requestIdentity, requestKey, outputName, mediaSelector,
  validateMetadata, selectSubtitle, selectedFormats, classifyBackendFailure, safeDiagnostic, publicError } from './youtube-core.mjs';
import { ensureDependencies } from './youtube-deps.mjs';
import { runProcess, outputDirectory, safeDirectory, lstatOrNull, regularFile, acquireLock,
  readPrivateJson, writePrivateJson, inventory, publishFile, isWithin } from './youtube-io.mjs';
import { processMedia, processSubtitle, verifyMedia, verifySubtitle } from './youtube-media.mjs';

export const HELP = `YouTube 工具（单视频 URL，JSON 结果）
  video URL [--format mp4|mkv] [--max-height 1080] [--dir ABS] [--overwrite yes|no] [--timeout 7200]
  audio URL [--format mp3|m4a] [--dir ABS] [--overwrite yes|no] [--timeout 7200]
  subtitles URL [--lang zh|en|ja|zh-Hans|...] [--format srt|vtt] [--dir ABS] [--overwrite yes|no]
  doctor   仅本地检查依赖，不下载媒体，不自动安装
  repair   由 Agent 安全检查并安装/修复缺失或不兼容依赖
默认目录：当前执行用户 ~/Downloads/YouTube；文件名取视频标题并安全处理，默认不覆盖。超时时间单位为秒。
字幕只用所选语言的人工/原生自动字幕，不翻译；默认中文 SRT。
不支持播放列表批量任务、登录、Cookie、付费/私有资源或直播录制。
宿主可用 YOUTUBE_AUTO_INSTALL=0 禁止安装。新依赖与旧 Email 配置隔离。`;

export function backendArgs(deps) {
  const runtime = path.isAbsolute(deps.js.path) ? `${deps.js.type}:${deps.js.path}` : deps.js.type;
  const args = ['--ignore-config', '--no-plugin-dirs', '--no-remote-components', '--no-playlist',
    '--no-cache-dir', '--no-progress', '--no-colors', '--socket-timeout', '20', '--retries', '2',
    '--fragment-retries', '2', '--extractor-retries', '1', '--file-access-retries', '1',
    '--no-js-runtimes', '--js-runtimes', runtime, '--extractor-args', 'youtube:skip=translated_subs'];
  if (path.isAbsolute(deps.ffmpeg.path)) args.push('--ffmpeg-location', deps.ffmpeg.path);
  return args;
}
export function safeChildEnv(env = process.env) {
  const allowed = new Set(['PATH', 'HOME', 'USERPROFILE', 'LOCALAPPDATA', 'APPDATA', 'SystemRoot', 'SYSTEMROOT',
    'WINDIR', 'TEMP', 'TMP', 'TMPDIR', 'LANG', 'LC_ALL', 'TZ', 'SSL_CERT_FILE', 'SSL_CERT_DIR',
    'HTTPS_PROXY', 'HTTP_PROXY', 'ALL_PROXY', 'NO_PROXY', 'https_proxy', 'http_proxy', 'all_proxy', 'no_proxy']);
  return Object.fromEntries(Object.entries(env).filter(([key]) => allowed.has(key)));
}
function failedBackend(result, fallback = 'download_failed') {
  const text = result.stderr || result.stdout;
  if (/ejs.*(?:missing|not found)|no supported javascript runtime|javascript.*(?:not available|not found)/iu.test(text)) {
    throw new YoutubeError('dependency_version', 'YouTube JavaScript/EJS 依赖不完整；需由 Agent 修复官方 yt-dlp/运行时');
  }
  throw new YoutubeError(classifyBackendFailure(text, fallback), '下载器返回失败：' + safeDiagnostic(text));
}
async function metadata(request, deps, runner, options) {
  const args = [...backendArgs(deps), '--skip-download', '--dump-single-json'];
  if (request.mode === 'subtitles') args.push('--ignore-no-formats-error');
  else args.push('--format', mediaSelector(request));
  const result = await runner(deps.ytdlp.path, [...args, '--', request.url], { ...options, timeoutMs: Math.min(request.timeoutMs, 120000) });
  if (result.code !== 0) failedBackend(result);
  let info;
  try { info = JSON.parse(result.stdout); } catch { throw new YoutubeError('verification_failed', '下载器没有返回单视频 JSON 信息'); }
  validateMetadata(info, request.id);
  return info;
}

/** Safe-to-resume state is a checksum inventory, not an untrusted downloaded infojson. */
export async function openState(stage, request) {
  const stateFile = path.join(stage, 'state.json');
  if (!await lstatOrNull(stateFile)) {
    if ((await fs.readdir(stage)).length) throw new YoutubeError('resume_invalid', '存在未经验证的中间文件，拒绝把它们当作可恢复下载');
    return null;
  }
  const state = await readPrivateJson(stateFile);
  if (state.schema !== 1 || JSON.stringify(state.request) !== JSON.stringify(requestIdentity(request)) || !state.files) {
    throw new YoutubeError('resume_invalid', '断点状态与当前请求不匹配');
  }
  const actual = await inventory(stage, new Set(['state.json']));
  if (JSON.stringify(actual) !== JSON.stringify(state.files)) {
    throw new YoutubeError('resume_invalid', '断点文件的大小/校验值已改变；无法安全续传');
  }
  return state;
}
async function checkpoint(stage, request, plan) {
  await writePrivateJson(path.join(stage, 'state.json'), {
    schema: 1, request: requestIdentity(request), plan,
    files: await inventory(stage, new Set(['state.json'])),
  });
}
function sourcePlan(info, request) {
  const duration = Number(info.duration);
  const shared = { duration: Number.isFinite(duration) ? duration : null };
  if (request.mode === 'subtitles') return { ...shared, subtitle: selectSubtitle(info, request.language) };
  return { ...shared, formats: selectedFormats(info, request) };
}

async function fetchSource(request, deps, plan, stage, runner, options) {
  const args = [...backendArgs(deps), '--no-simulate', '--no-overwrites', '--continue',
    '--no-write-info-json', '--no-write-thumbnail', '--output', 'raw.%(ext)s'];
  if (request.mode === 'subtitles') {
    args.push('--skip-download', '--sub-langs', `^${plan.subtitle.code}$`, '--sub-format', 'vtt');
    args.push(...(plan.subtitle.source === 'manual' ? ['--write-subs', '--no-write-auto-subs'] : ['--no-write-subs', '--write-auto-subs']));
  } else {
    args.push('--no-write-subs', '--no-write-auto-subs', '--format', plan.formats.map(f => f.id).join('+'),
      '--merge-output-format', 'mkv', '--print', 'after_move:%(filepath)j');
  }
  const result = await runner(deps.ytdlp.path, [...args, '--', request.url], { ...options, cwd: stage, timeoutMs: request.timeoutMs });
  if (result.code !== 0) failedBackend(result);
  if (request.mode === 'subtitles') {
    const expected = path.join(stage, `raw.${plan.subtitle.code}.vtt`);
    if (!await lstatOrNull(expected)) throw new YoutubeError('subtitle_unavailable', '下载器没有生成所选语言的字幕文件');
    await regularFile(expected); return expected;
  }
  const candidates = result.stdout.trim().split(/\r?\n/u).map(line => { try { return JSON.parse(line); } catch { return null; } })
    .filter(value => typeof value === 'string');
  if (candidates.length !== 1) throw new YoutubeError('verification_failed', '未收到唯一、实际生成的媒体路径');
  const file = path.resolve(stage, candidates[0]);
  if (!isWithin(stage, file) || path.dirname(file) !== stage || !/^raw\.[A-Za-z0-9_-]+$/u.test(path.basename(file))) {
    throw new YoutubeError('file_security', '下载器返回了恢复目录之外的路径或异常文件名');
  }
  if (!await lstatOrNull(file)) throw new YoutubeError('verification_failed', '下载器没有生成其报告的成品文件');
  await regularFile(file); return file;
}

export async function executeRequest(request, context = {}) {
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
  const stateRoot = await safeDirectory(path.join(directory, '.youtube-partials'), { privateLeaf: true });
  const key = requestKey(request);
  const release = await acquireLock(path.join(stateRoot, key + '.lock'));
  let stage, plan, finalPath, mayCheckpoint = false, published = false;
  try {
    stage = await safeDirectory(path.join(stateRoot, key), { privateLeaf: true });
    const previous = await openState(stage, request);
    let deps = await resolver({ home, env, runner });
    const options = { signal: context.signal, cwd: stage, env: safeChildEnv(env) };
    let info;
    try { info = await metadata(request, deps, runner, options); }
    catch (e) {
      // A single root-cause recovery for a host yt-dlp lacking EJS. Never retry access restrictions.
      if (e.status !== 'dependency_version' || deps.ytdlp.source !== 'host' || env.YOUTUBE_YTDLP_BIN || env.YOUTUBE_AUTO_INSTALL === '0') throw e;
      deps = await resolver({ home, env, runner, force: true });
      info = await metadata(request, deps, runner, options);
    }
    finalPath = path.join(directory, outputName(request, info.title));
    if (!request.overwrite && await lstatOrNull(finalPath)) {
      throw new YoutubeError('file_exists', '成品已存在；默认不覆盖', { existing_file: finalPath });
    }
    if (request.overwrite && await lstatOrNull(finalPath)) await regularFile(finalPath, { allowEmpty: true });
    plan = sourcePlan(info, request);
    if (previous && JSON.stringify(previous.plan) !== JSON.stringify(plan)) {
      throw new YoutubeError('resume_invalid', '视频选定流/字幕来源已变化，旧断点不再匹配，拒绝继续写入');
    }
    mayCheckpoint = true;
    await checkpoint(stage, request, plan);
    const source = await fetchSource(request, deps, plan, stage, runner, options);
    const prepared = path.join(stage, 'prepared.' + request.format);
    // Any prior prepared file was already covered by the validated recovery inventory.
    let processing = { transcoded: false }, verified;
    const mediaOptions = { runner: (bin, args, opts) => runner(bin, args, { ...options, ...opts }), signal: context.signal };
    if (request.mode === 'subtitles') {
      await processSubtitle(source, prepared, request.format, deps, mediaOptions);
      verified = await verifySubtitle(prepared, request.format);
    } else {
      processing = await processMedia(source, prepared, request, deps, mediaOptions);
      verified = await verifyMedia(prepared, request, deps, plan.duration, mediaOptions);
    }
    await publishFile(prepared, finalPath, request.overwrite);
    published = true;
    const result = { ok: true, status: 'downloaded', mode: request.mode, video_id: request.id,
      file: finalPath, format: request.format, ...verified, ...processing,
      recovered: Boolean(previous && Object.keys(previous.files).length), untrusted: true };
    if (plan.subtitle) Object.assign(result, { requested_language: request.language, language: plan.subtitle.language, subtitle_source: plan.subtitle.source });
    try { await fs.rm(stage, { recursive: true }); } catch { result.warning = '成品已验证保存，但中间目录清理失败'; }
    return result;
  } catch (error) {
    if (stage && plan && mayCheckpoint && !published) {
      try {
        await checkpoint(stage, request, plan);
        if (error instanceof YoutubeError) error.details = { ...error.details, recovery_directory: stage, partial_files_preserved: true };
      } catch {
        if (error instanceof YoutubeError) error.details = { ...error.details, recovery_directory: stage, resume_verified: false };
      }
    }
    throw error;
  } finally { await release(); }
}

export async function main(argv = process.argv.slice(2)) {
  const controller = new AbortController();
  const interrupted = () => controller.abort();
  process.once('SIGINT', interrupted); process.once('SIGTERM', interrupted);
  try {
    const result = await executeRequest(parseRequest(argv), { signal: controller.signal });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stdout.write(JSON.stringify(publicError(error), null, 2) + '\n');
    process.exitCode = error.status === 'interrupted' ? 130 : 1;
  } finally { process.removeListener('SIGINT', interrupted); process.removeListener('SIGTERM', interrupted); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
