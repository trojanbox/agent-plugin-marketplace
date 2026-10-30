#!/usr/bin/env node
/**
 * Linux operations: private defaults + reusable bin scripts + ordinary Bash.
 * Management prints metadata only. Execution deliberately inherits raw stdio.
 * This is a user-owned convenience tool, NOT a same-UID security sandbox.
 */
import * as fs from 'node:fs/promises';
import { constants as F } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, execFile } from 'node:child_process';
import { promisify, parseEnv as nodeParseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { Writable } from 'node:stream';

const execFileAsync = promisify(execFile);
const ENV_LIMIT = 128 * 1024;
const SCRIPT_LIMIT = 1024 * 1024;
const KEY = /^[A-Za-z_][A-Za-z0-9_]{0,127}$/u;
const NAME = /^[A-Za-z][A-Za-z0-9_.-]{0,95}$/u;
const MODE = /^[A-Za-z0-9_-]{1,64}$/u;
const RESERVED = /^(?:PATH|HOME|SHELL|USER|LOGNAME|PWD|OLDPWD|IFS|ENV|BASH_ENV|BASHOPTS|SHELLOPTS|NODE_OPTIONS|NODE_ENV|LINUX_OPS_HOME|LD_.*|DYLD_.*)$/u;
export class OpsError extends Error {
  constructor(status, message, details = {}) { super(message); this.name = 'OpsError'; this.status = status; this.details = details; }
}
const fail = (s, m, d = {}) => { throw new OpsError(s, m, d); };
const ensure = (c, m) => { if (!c) fail('invalid_input', m); };
const own = (o, k) => Object.hasOwn(o, k);
const uid = ctx => ctx.uid ?? process.getuid?.();
const parentEnv = ctx => ctx.parentEnv ?? process.env;
const validName = name => typeof name === 'string' && NAME.test(name) && !name.includes('..') && !name.includes('.tmp-');
function absolute(value, label) {
  ensure(typeof value === 'string' && path.isAbsolute(value) && path.resolve(value) === value &&
    !value.split(path.sep).includes('..') && !/[\x00-\x1f\x7f]/u.test(value), label + ' 必须是无 .. 的绝对路径');
  return value;
}
function csv(value, label) {
  const values = String(value).split(',');
  ensure(values.length <= 64 && values.every(x => KEY.test(x)), label + ' 必须为逗号分隔的变量名/前缀，不支持通配符或空值');
  return [...new Set(values)];
}
export const HELP = [
  'Linux Ops — Linux 普通用户脚本工具箱；Node.js 20.12+，Bash。',
  '默认独立目录 ~/.linux-ops/，.env 与 bin/ 同级；--root ABS 或 LINUX_OPS_HOME 可改位置。',
  '  init | doctor',
  '  config list [--prefix DEV_DB_]              仅列键名和空值状态',
  '  config check --keys DEV_DB_HOST,DEV_DB_PASS  检查必需项，不显示值',
  '  config set KEY [--stdin]                    默认用户本机隐藏输入，或从stdin读值',
  '  config unset KEY',
  '  config import --from ABS_ENV [--replace]    默认遇同名键拒绝；不迁移其他工具凭据',
  '  scripts list | scripts show NAME',
  '  scripts put NAME --from ABS_SCRIPT [--replace]',
  '  scripts put NAME --stdin [--replace]        保存带shebang的脚本，未显式replace不覆盖',
  '  scripts remove NAME',
  '  exec [--prefix DEV_DB_] [--cwd ABS] [--mode development] -- "Shell command | pipeline"',
  '  run NAME [--prefix DEV_DB_] [--cwd ABS] -- arg1 "arg with spaces"',
  '执行选项：--prefix可重复，--require KEY1,KEY2，--project-env auto|off|FILE（FILE可重复），--timeout SECONDS。',
  'exec/run 原样转发 stdin/stdout/stderr 和退出码，无摘要、脱敏、普通执行审批或默认超时。',
  '已继承的环境优先；共享.env只按前缀补缺。项目.env声明的键默认不注入，让程序原生加载器处理。',
  '--mode 默认继承NODE_ENV，否则development；构建请指定--mode production，自定义env目录用--project-env FILE。',
  '不会自行加载项目.env的独立脚本使用--project-env off（或脚本元数据声明）。',
  '脚本头可声明 # linux-ops: prefixes=DEV_DB_ 与 # linux-ops: requires=DEV_DB_HOST。',
  'Agent不主动读.env或打印密钥；完整Shell和原始输出可能暴露脚本自行打印的密钥，不承诺硬隔离。',
].join('\n');

export function parseArgs(argv) {
  const separator = argv.indexOf('--');
  const words = [...(separator < 0 ? argv : argv.slice(0, separator))];
  const tail = separator < 0 ? [] : argv.slice(separator + 1);
  let root;
  for (let i = 0; i < words.length; i++) if (words[i] === '--root') {
    ensure(root === undefined && words[i + 1] !== undefined, '--root 不得重复或缺值');
    root = absolute(words[i + 1], '--root'); words.splice(i, 2); i--;
  }
  if (!words.length || (words.length === 1 && ['help', '--help', '-h'].includes(words[0]))) {
    ensure(tail.length === 0, 'help 不接受命令'); return { action: 'help', ...(root ? {root} : {}) };
  }
  const first = words.shift();
  let action = first, name;
  if (first === 'config' || first === 'scripts') {
    action = first + '.' + words.shift();
    if (['config.set', 'config.unset', 'scripts.put', 'scripts.show', 'scripts.remove'].includes(action)) name = words.shift();
  } else if (first === 'run') name = words.shift();
  const allowed = {
    init: [], doctor: [], 'config.list': ['--prefix'], 'config.check': ['--keys'],
    'config.set': ['--stdin'], 'config.unset': [], 'config.import': ['--from', '--replace'],
    'scripts.list': [], 'scripts.show': [], 'scripts.remove': [], 'scripts.put': ['--from', '--stdin', '--replace'],
    exec: ['--prefix', '--require', '--cwd', '--mode', '--project-env', '--timeout'],
    run: ['--prefix', '--require', '--cwd', '--mode', '--project-env', '--timeout'],
  };
  ensure(own(allowed, action), '不支持该命令；运行 --help 查看用法');
  if (name !== undefined) ensure(action.startsWith('config.') ? KEY.test(name) : validName(name), '键名或脚本名无效');
  if (['config.set', 'config.unset', 'scripts.put', 'scripts.show', 'scripts.remove', 'run'].includes(action))
    ensure(typeof name === 'string', '缺少键名或脚本名');
  const request = {action, ...(root ? {root} : {}), ...(name ? {name} : {})};
  const seen = new Set();
  for (let i = 0; i < words.length; i++) {
    const flag = words[i];
    ensure(allowed[action].includes(flag), '未知参数；不接收明文密钥或未经 -- 分隔的Shell内容');
    const repeated = ['--prefix', '--project-env'].includes(flag);
    ensure(repeated || !seen.has(flag), '参数不能重复'); seen.add(flag);
    if (flag === '--stdin' || flag === '--replace') { request[flag.slice(2)] = true; continue; }
    const value = words[++i]; ensure(value !== undefined, '选项缺少值');
    if (flag === '--prefix') request.prefixes = [...new Set([...(request.prefixes || []), ...csv(value, '--prefix')])];
    if (flag === '--require') request.required = csv(value, '--require');
    if (flag === '--keys') request.keys = csv(value, '--keys');
    if (flag === '--from') request.from = absolute(value, '--from');
    if (flag === '--cwd') request.cwd = absolute(value, '--cwd');
    if (flag === '--mode') { ensure(MODE.test(value), '--mode 无效'); request.mode = value; }
    if (flag === '--project-env') {
      ensure(['auto', 'off'].includes(value) || (value && !/[\x00-\x1f\x7f]/u.test(value)), '--project-env 无效');
      request.projectEnv = [...(request.projectEnv || []), value];
    }
    if (flag === '--timeout') {
      ensure(/^\d+(?:\.\d+)?$/u.test(value) && Number(value) > 0 && Number(value) <= 86400, '--timeout 必须大于0且不超过86400秒');
      request.timeout = Number(value);
    }
  }
  if (request.projectEnv?.some(x => ['auto', 'off'].includes(x))) ensure(request.projectEnv.length === 1, 'auto/off不能与项目文件路径混用');
  if (action === 'config.check') ensure(request.keys?.length, 'check 需要 --keys');
  if (action === 'config.import') ensure(request.from, 'import 需要 --from');
  if (action === 'scripts.put') ensure(Boolean(request.from) !== Boolean(request.stdin), 'put 必须选择 --from 或 --stdin');
  if (action === 'exec') {
    ensure(separator >= 0 && tail.length === 1 && tail[0].length && !tail[0].includes('\0'), 'exec -- 后必须是一个完整Shell命令字符串');
    request.command = tail[0];
  } else if (action === 'run') request.args = tail;
  else ensure(separator < 0, '管理命令不接受执行参数');
  return request;
}

/** Shared file: strict single-line dotenv, never source/eval/expand. */
export function parseDotenv(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > ENV_LIMIT || text.includes('\0')) fail('invalid_env', '.env无效或超过128KiB');
  const output = Object.create(null);
  let lineNumber = 0;
  for (const line of text.replace(/^\uFEFF/u, '').split(/\r?\n/u)) {
    lineNumber++;
    if (/^\s*(?:#.*)?$/u.test(line)) continue;
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]{0,127})\s*=\s*(.*)$/u);
    if (!match) fail('invalid_env', '不支持的.env格式', {line: lineNumber});
    const [, key, raw] = match;
    if (own(output, key)) fail('invalid_env', '重复环境变量名', {key});
    let value;
    if (raw.startsWith('"')) {
      const quoted = raw.match(/^("(?:[^"\\]|\\.)*")\s*(?:#.*)?$/u);
      if (!quoted) fail('invalid_env', '双引号格式无效', {line: lineNumber});
      try { value = JSON.parse(quoted[1]); } catch { fail('invalid_env', '双引号转义无效', {line: lineNumber}); }
    } else if (raw.startsWith("'")) {
      const quoted = raw.match(/^'([^']*)'\s*(?:#.*)?$/u);
      if (!quoted) fail('invalid_env', '单引号格式无效', {line: lineNumber});
      value = quoted[1];
    } else value = raw.replace(/\s+#.*$/u, '').trimEnd();
    if (value.includes('\0')) fail('invalid_env', '环境变量不得包含NUL', {key});
    output[key] = value;
  }
  return output;
}
function gate(ctx) {
  if ((ctx.platform ?? process.platform) !== 'linux') fail('unsupported_platform', '首版仅支持Linux');
  if (!Number.isInteger(uid(ctx)) || uid(ctx) <= 0) fail('unsupported_user', '请以目标普通用户身份运行，不使用sudo/root');
}
function paths(request, ctx) {
  const root = absolute(request.root || ctx.root || parentEnv(ctx).LINUX_OPS_HOME || path.join(os.homedir(), '.linux-ops'), '运行根目录');
  ensure(root !== '/', '运行根目录不得为 /');
  return {root, env: path.join(root, '.env'), bin: path.join(root, 'bin')};
}
async function lstat(file) { try { return await fs.lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
function identity(stat) { return stat && [stat.dev, stat.ino, stat.size, stat.mtimeMs, stat.ctimeMs].join(':'); }
async function directory(file, ctx, create = false) {
  let stat = await lstat(file);
  if (!stat && create) { await fs.mkdir(file, {recursive:true, mode:0o700}); stat = await fs.lstat(file); }
  if (!stat) fail('not_initialized', '运行目录不存在，请先 init');
  if (!stat.isDirectory() || stat.isSymbolicLink() || stat.uid !== uid(ctx) || (stat.mode & 0o077) !== 0 || await fs.realpath(file) !== file)
    fail('file_security', '运行目录必须为本人拥有的0700真实目录', {path:file});
}
async function safeRead(file, ctx, {privateFile = true, limit = ENV_LIMIT} = {}) {
  const before = await lstat(file);
  if (!before) fail('not_found', '文件不存在', {path:file});
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1 || before.uid !== uid(ctx) ||
    (before.mode & (privateFile ? 0o077 : 0o022)) !== 0 || before.size > limit || await fs.realpath(file) !== file)
    fail('file_security', '文件类型、权限、属主或链接不安全', {path:file});
  const handle = await fs.open(file, F.O_RDONLY | F.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (identity(opened) !== identity(before)) fail('conflict', '文件读取前已变化');
    const text = await handle.readFile('utf8');
    if (Buffer.byteLength(text) > limit || identity(await handle.stat()) !== identity(opened)) fail('conflict', '文件读取期间变化或超限');
    return {text, stat:opened};
  } finally { await handle.close(); }
}
async function store(request, ctx) {
  const p = paths(request, ctx); await directory(p.root, ctx); await directory(p.bin, ctx);
  const file = await safeRead(p.env, ctx); return {...p, ...file, values:parseDotenv(file.text)};
}
async function locked(p, callback) {
  let handle;
  try { handle = await fs.open(path.join(p.root,'.lock'), 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') fail('busy', '已有配置/脚本写入锁，请确认其他操作结束；不自动重试或删锁'); throw error; }
  try { await handle.writeFile(String(process.pid)); return await callback(); }
  finally { await handle.close(); await fs.unlink(path.join(p.root,'.lock')); }
}
async function atomicWrite(file, text, mode, previous, ctx) {
  const tmp = file + '.tmp-' + crypto.randomBytes(8).toString('hex');
  const handle = await fs.open(tmp, 'wx', mode);
  try {
    await handle.writeFile(text, 'utf8'); await handle.sync(); await handle.close();
    if (previous) {
      const now = await safeRead(file, ctx, {limit:SCRIPT_LIMIT});
      if (identity(now.stat) !== identity(previous)) fail('conflict', '文件在更新期间被其他程序修改');
      await fs.rename(tmp, file);
    } else {
      try { await fs.link(tmp, file); }
      catch (e) { if (e.code === 'EEXIST') fail('already_exists', '文件已存在，必须显式 --replace'); throw e; }
    }
  } finally { await handle.close().catch(()=>{}); await fs.unlink(tmp).catch(e=>{if(e.code!=='ENOENT')throw e;}); }
}
function editEnv(text, updates, deleted = new Set()) {
  const pending = {...updates};
  const lines = text.replace(/^\uFEFF/u,'').split(/\r?\n/u).filter((line, index, all) => index < all.length-1 || line !== '');
  const next = [];
  for (const line of lines) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/u);
    const key = match?.[1];
    if (key && deleted.has(key)) continue;
    if (key && own(pending,key)) { next.push(key+'='+JSON.stringify(pending[key])); delete pending[key]; }
    else next.push(line);
  }
  for (const key of Object.keys(pending)) next.push(key+'='+JSON.stringify(pending[key]));
  const result = next.join('\n')+'\n'; parseDotenv(result); return result;
}
async function readInput(request, ctx, sensitive) {
  if (ctx.input !== undefined) return String(ctx.input); // isolated test injection, not a CLI value option
  if (request.stdin) {
    let total = 0; const chunks = [];
    for await (const chunk of process.stdin) { total+=chunk.length; if(total>SCRIPT_LIMIT)fail('invalid_input','stdin超过1MiB'); chunks.push(chunk); }
    return Buffer.concat(chunks).toString('utf8');
  }
  if (!sensitive || !process.stdin.isTTY || !process.stderr.isTTY) fail('input_required', '请用户在本机终端隐藏输入，或显式 --stdin；不要把密钥放进命令参数/聊天');
  const muted = new Writable({write(_chunk,_encoding,callback){callback();}});
  const rl = readline.createInterface({input:process.stdin,output:muted,terminal:true});
  process.stderr.write('为 '+request.name+' 输入新值（不回显）：');
  const controller = new AbortController();
  rl.once('SIGINT',()=>controller.abort());
  rl.once('close',()=>controller.abort());
  try {
    return await rl.question('', {signal:controller.signal});
  } catch { fail('cancelled','输入已取消，配置未修改'); }
  finally { rl.close(); process.stderr.write('\n'); }
}
export function scriptMetadata(source) {
  const result = {prefixes:[], required:[]}; const found = new Set();
  for (const line of source.split(/\r?\n/u).slice(0,40)) {
    const m = line.match(/^#\s*linux-ops:\s*(prefixes|requires|project-env)=(.*)$/u);
    if (!m) continue;
    if(found.has(m[1]))fail('invalid_script','脚本元数据重复');found.add(m[1]);
    const value = m[2].trim();
    if(m[1]==='project-env') { ensure(['off','auto'].includes(value),'脚本project-env只能为auto/off');result.projectEnv=[value]; }
    else result[m[1]==='prefixes'?'prefixes':'required'] = csv(value,'脚本元数据');
  }
  return result;
}
async function scriptRead(p, name, ctx) {
  ensure(validName(name),'脚本名无效'); await directory(p.bin,ctx);
  const file = path.join(p.bin,name); const data = await safeRead(file,ctx,{limit:SCRIPT_LIMIT});
  if(!data.text.startsWith('#!') || data.text.includes('\0'))fail('invalid_script','持久化脚本必须是带shebang的UTF-8文本');
  return {file,...data,...scriptMetadata(data.text)};
}

export async function manage(request, ctx = {}) {
  if(request.action==='help')return {ok:true,status:'help',help:HELP};
  gate(ctx); const p=paths(request,ctx);
  if(request.action==='init') {
    await directory(p.root,ctx,true);await directory(p.bin,ctx,true);
    if(!await lstat(p.env)) {
      try {await atomicWrite(p.env,'# Linux Ops private defaults; do not commit this file.\n',0o600,null,ctx);}
      catch(e){if(e.status!=='already_exists')throw e;}
    }
    await store(request,ctx);return {ok:true,status:'ready',root:p.root,env_file:p.env,bin:p.bin};
  }
  if(request.action==='doctor') {
    const envExists=Boolean(await lstat(p.env));
    if(envExists)await store(request,ctx);
    return {ok:true,status:'diagnostic',root:p.root,initialized:envExists,platform:'linux',bash:await fs.access('/bin/bash',F.X_OK).then(()=>true,()=>false)};
  }
  if(['exec','run'].includes(request.action))fail('invalid_input','请通过执行入口运行命令');
  const s=await store(request,ctx);
  if(request.action==='config.list') {
    const keys=Object.keys(s.values).filter(k=>!request.prefixes?.length || request.prefixes.some(p=>k.startsWith(p))).sort();
    return {ok:true,status:'keys',keys,empty_keys:keys.filter(k=>s.values[k]==='')};
  }
  if(request.action==='config.check') {
    const env={...s.values,...parentEnv(ctx)};
    const missing=request.keys.filter(k=>!own(env,k)||env[k]==='');
    return {ok:true,status:'requirements',ready:missing.length===0,present:request.keys.filter(k=>!missing.includes(k)),missing};
  }
  if(request.action==='config.set') {
    const value=(await readInput(request,ctx,true)).replace(/\r?\n$/u,'');
    if(value.includes('\0')||Buffer.byteLength(value)>ENV_LIMIT/2)fail('invalid_input','值含NUL或超过64KiB');
    return locked(p,async()=>{
      const current=await store(request,ctx);const text=editEnv(current.text,{[request.name]:value});
      await atomicWrite(p.env,text,0o600,current.stat,ctx);
      return {ok:true,status:'saved',key:request.name};
    });
  }
  if(request.action==='config.unset') return locked(p,async()=>{
    const current=await store(request,ctx);
    if(!own(current.values,request.name))return {ok:true,status:'unchanged',key:request.name};
    await atomicWrite(p.env,editEnv(current.text,{},new Set([request.name])),0o600,current.stat,ctx);
    return {ok:true,status:'removed',key:request.name};
  });
  if(request.action==='config.import') {
    const source=await safeRead(request.from,ctx);const imported=parseDotenv(source.text);
    return locked(p,async()=>{
      const current=await store(request,ctx);const conflicts=Object.keys(imported).filter(k=>own(current.values,k));
      if(conflicts.length&&!request.replace)fail('conflict','导入包含同名键；先核对键名再显式 --replace',{keys:conflicts});
      await atomicWrite(p.env,editEnv(current.text,imported),0o600,current.stat,ctx);
      return {ok:true,status:'imported',keys:Object.keys(imported).sort()};
    });
  }
  if(request.action==='scripts.list') {
    const scripts=[];
    for(const name of (await fs.readdir(p.bin)).sort()) if(validName(name)&&!name.includes('.tmp-')) {
      const r=await scriptRead(p,name,ctx);scripts.push({name,prefixes:r.prefixes,required:r.required,bytes:r.stat.size});
    }
    return {ok:true,status:'scripts',scripts};
  }
  if(request.action==='scripts.show') {
    const data=await scriptRead(p,request.name,ctx);
    return {ok:true,status:'script',name:request.name,source:data.text,prefixes:data.prefixes,required:data.required};
  }
  if(request.action==='scripts.put') {
    const text=request.from ? (await safeRead(request.from,ctx,{privateFile:false,limit:SCRIPT_LIMIT})).text : await readInput(request,ctx,false);
    if(Buffer.byteLength(text)>SCRIPT_LIMIT || !/^#![^\r\n]+\n/u.test(text) || text.includes('\0'))fail('invalid_script','脚本需要shebang，大小不超过1MiB且不可含NUL');
    scriptMetadata(text);
    // Syntax-only validation: never run newly supplied Bash while saving it.
    if(/^#![^\n]*\bbash(?:\s|$)/u.test(text)) {
      const tmp=path.join(p.root,'.syntax-'+crypto.randomBytes(8).toString('hex'));
      await fs.writeFile(tmp,text,{flag:'wx',mode:0o600});
      try {await execFileAsync('/bin/bash',['--noprofile','--norc','-n',tmp],{timeout:5000,maxBuffer:16384});}
      catch{fail('invalid_script','Bash语法检查失败，原脚本未修改');}
      finally{await fs.unlink(tmp);}
    }
    return locked(p,async()=>{
      const file=path.join(p.bin,request.name);let previous=null;
      if(await lstat(file)) {if(!request.replace)fail('already_exists','同名脚本已存在，必须显式 --replace');previous=(await scriptRead(p,request.name,ctx)).stat;}
      await atomicWrite(file,text,0o700,previous,ctx);return {ok:true,status:'saved',name:request.name,path:file};
    });
  }
  if(request.action==='scripts.remove') return locked(p,async()=>{
    const data=await scriptRead(p,request.name,ctx);await fs.unlink(data.file);return {ok:true,status:'removed',name:request.name};
  });
  fail('invalid_input','未知管理命令');
}

async function projectKeys(request,cwd,ctx) {
  const option=request.projectEnv || ['auto']; if(option[0]==='off')return new Set();
  let files;
  if(option[0]==='auto') {
    const mode=request.mode || parentEnv(ctx).NODE_ENV || 'development';
    ensure(MODE.test(mode),'NODE_ENV/--mode不可用于安全的项目配置查找');
    let isNext=false;
    const packageFile=path.join(cwd,'package.json');
    if(await lstat(packageFile)) {
      try {const p=JSON.parse((await safeRead(packageFile,ctx,{privateFile:false,limit:SCRIPT_LIMIT})).text);isNext=Boolean(p.dependencies?.next||p.devDependencies?.next);}
      catch(e){if(e instanceof OpsError)throw e; /* malformed package JSON is the child command's responsibility */}
    }
    files=['.env',...(!(isNext&&mode==='test')?['.env.local']:[]),`.env.${mode}`,`.env.${mode}.local`].map(n=>path.join(cwd,n));
  } else files=option.map(f=>path.resolve(cwd,f));
  const result=new Set();
  for(const file of files) {
    if(!await lstat(file)) {if(option[0]!=='auto')fail('not_found','指定的项目环境文件不存在',{path:file});continue;}
    const data=await safeRead(file,ctx,{privateFile:false,limit:SCRIPT_LIMIT});
    // Only reserve declarations; leave values/expansion/order to the program's
    // real dotenv loader. No project value is exported to the Agent or child here.
    for(const key of Object.keys(nodeParseEnv(data.text))) if(KEY.test(key))result.add(key);
  }
  return result;
}
export async function prepareExecution(request,ctx={}) {
  gate(ctx);ensure(['exec','run'].includes(request.action),'不是执行请求');
  const s=await store(request,ctx);
  const cwd=absolute(request.cwd||ctx.cwd||process.cwd(),'工作目录');
  const cwdStat=await lstat(cwd);if(!cwdStat?.isDirectory())fail('not_found','工作目录不存在');
  let metadata={prefixes:[],required:[]},script;
  if(request.action==='run'){script=await scriptRead(s,request.name,ctx);metadata=script;}
  const prefixes=request.prefixes ?? metadata.prefixes;
  const required=[...new Set([...(metadata.required||[]),...(request.required||[])])];
  const env=Object.assign(Object.create(null),parentEnv(ctx));const selected=Object.keys(s.values).filter(k=>prefixes.some(p=>k.startsWith(p)));
  const reserved=selected.filter(k=>RESERVED.test(k));if(reserved.length)fail('reserved_variable','共享默认配置不能改写系统运行控制变量',{keys:reserved});
  const owned=await projectKeys({...request,projectEnv:request.projectEnv??metadata.projectEnv},cwd,ctx);
  const injected=[];
  for(const key of selected)if(!own(env,key)&&!owned.has(key)){env[key]=s.values[key];injected.push(key);}
  const missing=required.filter(k=>own(env,k)?env[k]==='':!owned.has(k));
  if(missing.length)fail('missing_environment','缺少必需变量，请通过 config set/import 在本机补齐',{keys:missing});
  const report={injected_keys:injected.sort(),project_owned:[...owned].filter(k=>selected.includes(k)||required.includes(k)).sort(),
    deferred_required:required.filter(k=>!own(env,k)&&owned.has(k)).sort()};
  return {program:script?script.file:'/bin/bash',args:script?(request.args||[]):['--noprofile','--norc','-c',request.command],
    cwd,env,timeout:request.timeout||0,report};
}
export async function execute(request,ctx={}) {
  const plan=await prepareExecution(request,ctx);
  // Independent group for piped Agent calls: cancellation also reaches grandchildren.
  // Interactive terminals retain the foreground group so child input behaves normally.
  const separateGroup=!process.stdin.isTTY;
  const child=spawn(plan.program,plan.args,{cwd:plan.cwd,env:plan.env,stdio:'inherit',detached:separateGroup});
  let timedOut=false,timer,killTimer,spawnFailure;
  const send=signal=>{try{if(child.pid)process.kill(separateGroup?-child.pid:child.pid,signal);}catch(e){if(e.code!=='ESRCH')spawnFailure=e;}};
  const forwardInt=()=>send('SIGINT'),forwardTerm=()=>send('SIGTERM'),forwardHup=()=>send('SIGHUP');
  process.on('SIGINT',forwardInt);process.on('SIGTERM',forwardTerm);process.on('SIGHUP',forwardHup);
  if(plan.timeout)timer=setTimeout(()=>{timedOut=true;send('SIGTERM');killTimer=setTimeout(()=>send('SIGKILL'),1500);},plan.timeout*1000);
  try {
    return await new Promise(resolve=>{
      child.once('error',error=>{spawnFailure=error;});
      child.once('close',(code,signal)=>{
        if(spawnFailure){process.stderr.write('linux-ops: 无法启动命令，请检查脚本解释器和执行权限。\n');resolve(spawnFailure.code==='ENOENT'?127:126);}
        else resolve(timedOut?124:(code??(128+(os.constants.signals[signal]||1))));
      });
    });
  } finally {
    clearTimeout(timer);clearTimeout(killTimer);process.removeListener('SIGINT',forwardInt);process.removeListener('SIGTERM',forwardTerm);process.removeListener('SIGHUP',forwardHup);
  }
}
export async function main(argv=process.argv.slice(2)) {
  let request;
  try {
    request=parseArgs(argv);
    if(['exec','run'].includes(request.action)){process.exitCode=await execute(request);return;}
    const result=await manage(request);process.stdout.write(JSON.stringify(result,null,2)+'\n');
    if(result.ready===false)process.exitCode=2;
  } catch(error) {
    const output=error instanceof OpsError?{ok:false,status:error.status,message:error.message,...error.details}:
      {ok:false,status:'local_error',message:'本地操作失败，请检查依赖或文件权限；配置原值未输出'};
    const stream=request&&['exec','run'].includes(request.action)?process.stderr:process.stdout;
    stream.write(JSON.stringify(output,null,2)+'\n');process.exitCode=1;
  }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
