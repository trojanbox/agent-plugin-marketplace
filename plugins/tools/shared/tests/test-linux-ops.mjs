import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseArgs, parseDotenv, manage, prepareExecution, OpsError } from '../scripts/linux-ops.mjs';

const exec = promisify(execFile);
const CLI = fileURLToPath(new URL('../scripts/linux-ops.mjs', import.meta.url));
const errorIs = status => error => error instanceof OpsError && error.status === status;
async function fixture(t) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'linux-ops-test-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const root = path.join(base, 'ops root');
  const cwd = path.join(base, 'project');
  await fs.mkdir(cwd, {mode:0o700});
  const ctx = {root, cwd, uid:process.getuid(), platform:'linux', parentEnv:{PATH:process.env.PATH, HOME:base}};
  const call = (args, more={}) => manage(parseArgs(args), {...ctx,...more});
  await call(['init']);
  const putEnv = async content => {
    await fs.writeFile(path.join(root,'.env'),content,{mode:0o600});
    await fs.chmod(path.join(root,'.env'),0o600);
  };
  const putScript = async (name, text, extra=[]) => call(['scripts','put',name,'--stdin',...extra],{input:text});
  const cli = (args, options={}) => exec(process.execPath,[CLI,'--root',root,...args],{
    cwd, env:{...process.env,HOME:base}, timeout:15_000, maxBuffer:8*1024*1024,...options});
  return {base,root,cwd,ctx,call,putEnv,putScript,cli};
}

test('CLI has generic Bash execution, scripts and config, no DB/profile commands',()=>{
  assert.equal(parseArgs([]).action,'help');
  const r=parseArgs(['exec','--prefix','DEV_DB_','--cwd','/tmp','--','printf ok | cat']);
  assert.equal(r.action,'exec');assert.deepEqual(r.prefixes,['DEV_DB_']);assert.equal(r.command,'printf ok | cat');
  assert.equal(parseArgs(['run','query.sh','--','hello world']).name,'query.sh');
  for(const args of [
    ['profiles'],['db-check','p','--engine','mysql'],['config','get','TOKEN'],
    ['config','set','KEY','SECRET'],['config','list','--reveal'],['exec','--prefix','*','--','true'],
    ['scripts','put','../escape','--stdin'],['scripts','put','.env','--stdin'],
    ['exec','--','echo','hi'],['exec','--mode','../prod','--','true'],
    ['exec','--prefix','','--','true'],['scripts','remove','job.sh','--confirm','yes'],
  ]) assert.throws(()=>parseArgs(args),errorIs('invalid_input'),args.join(' '));
});

test('dotenv is data, with literal dollars, comments, quotes and strict duplicates',()=>{
  const x=parseDotenv('export DEV_KEY="a#b=x"\nDEV_SINGLE=\'literal $HOME\'\nDEV_COMMAND=$(whoami)\nEMPTY=\n');
  assert.equal(x.DEV_KEY,'a#b=x');assert.equal(x.DEV_SINGLE,'literal $HOME');
  assert.equal(x.DEV_COMMAND,'$(whoami)');assert.equal(x.EMPTY,'');
  for(const text of ['A=1\nA=2','BAD-KEY=x','A="bad','A=\0','source /etc/passwd'])
    assert.throws(()=>parseDotenv(text),errorIs('invalid_env'));
});

test('init creates independent private .env and sibling bin, is idempotent',async t=>{
  const f=await fixture(t);await f.putEnv('DEV_TOKEN=fake-secret\n');
  const result=await f.call(['init']);assert.equal(result.status,'ready');
  for(const [p,mode] of [[f.root,0o700],[path.join(f.root,'bin'),0o700],[path.join(f.root,'.env'),0o600]])
    assert.equal((await fs.stat(p)).mode & 0o777,mode);
  assert.equal(await fs.readFile(path.join(f.root,'.env'),'utf8'),'DEV_TOKEN=fake-secret\n');
  assert.equal(await fs.stat(path.join(f.base,'.agent-plugin-marketplace')).then(()=>true,()=>false),false);
});

test('config changes are atomic, do not return values, empty keys and import collision explicit',async t=>{
  const f=await fixture(t);
  const secret='a$#=!fake-secret';
  assert.ok(!JSON.stringify(await f.call(['config','set','DEV_TOKEN','--stdin'],{input:secret+'\n'})).includes(secret));
  await f.call(['config','set','DEV_EMPTY','--stdin'],{input:''});
  const keys=await f.call(['config','list','--prefix','DEV_']);
  assert.deepEqual(keys.keys,['DEV_EMPTY','DEV_TOKEN']);assert.deepEqual(keys.empty_keys,['DEV_EMPTY']);
  assert.ok(!JSON.stringify(keys).includes(secret));
  const req=await f.call(['config','check','--keys','DEV_TOKEN,DEV_MISSING']);
  assert.equal(req.ready,false);assert.deepEqual(req.missing,['DEV_MISSING']);
  const source=path.join(f.base,'import.env');await fs.writeFile(source,'DEV_TOKEN=replacement\nNEW_KEY=value\n',{mode:0o600});
  await assert.rejects(()=>f.call(['config','import','--from',source]),errorIs('conflict'));
  await f.call(['config','import','--from',source,'--replace']);
  assert.equal(parseDotenv(await fs.readFile(path.join(f.root,'.env'),'utf8')).DEV_TOKEN,'replacement');
  await f.call(['config','unset','DEV_TOKEN']);
  assert.ok(!(await f.call(['config','list'])).keys.includes('DEV_TOKEN'));
  assert.deepEqual((await fs.readdir(f.root)).sort(),['.env','bin']);
});

test('concurrent management never loses updates and active lock fails without retry',async t=>{
  const f=await fixture(t);
  const responses=await Promise.allSettled([
    f.call(['config','set','A','--stdin'],{input:'first'}),
    f.call(['config','set','B','--stdin'],{input:'second'}),
  ]);
  const succeeded=responses.filter(x=>x.status==='fulfilled');assert.ok(succeeded.length>=1);
  const state=await f.call(['config','list']);assert.equal(state.keys.length,succeeded.length);
  await fs.writeFile(path.join(f.root,'.lock'),'test lock',{mode:0o600});
  await assert.rejects(()=>f.call(['config','set','C','--stdin'],{input:'third'}),errorIs('busy'));
  assert.ok(!(await f.call(['config','list'])).keys.includes('C'));
});

test('unsafe root, env symlink/hardlink/world-readable env rejected, no permission auto-fix',async t=>{
  const f=await fixture(t);const envPath=path.join(f.root,'.env');
  await fs.chmod(envPath,0o644);
  await assert.rejects(()=>f.call(['config','list']),errorIs('file_security'));
  assert.equal((await fs.stat(envPath)).mode & 0o777,0o644);
  await fs.chmod(envPath,0o600);const outside=path.join(f.base,'outside.env');
  await fs.link(envPath,outside);await assert.rejects(()=>f.call(['config','list']),errorIs('file_security'));
  await fs.unlink(outside);await fs.rename(envPath,outside);await fs.symlink(outside,envPath);
  await assert.rejects(()=>f.call(['config','list']),errorIs('file_security'));
  await assert.rejects(()=>f.call(['init'],{uid:0}),errorIs('unsupported_user'));
  await assert.rejects(()=>f.call(['init'],{platform:'darwin'}),errorIs('unsupported_platform'));
});

test('prefix selection, inherited values (including blank), reserved variables and no parent mutation',async t=>{
  const f=await fixture(t);
  await f.putEnv('DEV_HOST=shared\nDEV_EMPTY=fallback\nDEV_TOKEN=fake-token\nPROD_TOKEN=not-this\nPATH=/untrusted\n');
  const parent={PATH:process.env.PATH,DEV_HOST:'inherited',DEV_EMPTY:''};
  const plan=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--','true']),{...f.ctx,parentEnv:parent});
  assert.equal(plan.env.DEV_HOST,'inherited');assert.equal(plan.env.DEV_EMPTY,'');assert.equal(plan.env.DEV_TOKEN,'fake-token');
  assert.equal(plan.env.PROD_TOKEN,undefined);assert.equal(plan.env.PATH,process.env.PATH);assert.equal(parent.DEV_TOKEN,undefined);
  const none=await prepareExecution(parseArgs(['exec','--','true']),f.ctx);assert.equal(none.env.DEV_TOKEN,undefined);
  await assert.rejects(()=>prepareExecution(parseArgs(['exec','--prefix','PATH','--','true']),f.ctx),errorIs('reserved_variable'));
});

test('project-defined keys reserved for native loader, fallback not injected, values not returned',async t=>{
  const f=await fixture(t);
  await f.putEnv('DEV_HOST=shared\nDEV_ONLY_GLOBAL=global\n');
  await fs.writeFile(path.join(f.cwd,'.env'),'DEV_HOST=project-private-value\n');
  const req=parseArgs(['exec','--prefix','DEV_','--','true']);
  const prepared=await prepareExecution(req,f.ctx);
  assert.equal(prepared.env.DEV_HOST,undefined);assert.equal(prepared.env.DEV_ONLY_GLOBAL,'global');
  assert.deepEqual(prepared.report.project_owned,['DEV_HOST']);
  assert.ok(!JSON.stringify(prepared.report).includes('project-private-value'));
  assert.ok(!JSON.stringify(prepared.report).includes('global'));
  const off=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--project-env','off','--','true']),f.ctx);
  assert.equal(off.env.DEV_HOST,'shared');
});

test('mode-specific project declarations do not leak into other modes; explicit cwd and file supported',async t=>{
  const f=await fixture(t);await f.putEnv('DEV_X=shared\nDEV_Y=default\n');
  await fs.writeFile(path.join(f.cwd,'.env.production'),'DEV_X=production\n');
  let p=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--mode','development','--','true']),f.ctx);
  assert.equal(p.env.DEV_X,'shared');
  p=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--mode','production','--','true']),f.ctx);
  assert.equal(p.env.DEV_X,undefined);
  const custom=path.join(f.cwd,'custom.env');await fs.writeFile(custom,'DEV_Y=from-custom\n');
  p=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--project-env',custom,'--','true']),f.ctx);
  assert.equal(p.env.DEV_Y,undefined);assert.equal(p.env.DEV_X,'shared');
});

test('required keys: fail only after inherited/global/native project sources considered',async t=>{
  const f=await fixture(t);await f.putEnv('DEV_X=x\n');
  await assert.rejects(()=>prepareExecution(parseArgs(['exec','--prefix','DEV_','--require','DEV_X,DEV_Y','--','true']),f.ctx),errorIs('missing_environment'));
  await fs.writeFile(path.join(f.cwd,'.env'),'DEV_Y=local\n');
  const p=await prepareExecution(parseArgs(['exec','--prefix','DEV_','--require','DEV_X,DEV_Y','--','true']),f.ctx);
  assert.deepEqual(p.report.deferred_required,['DEV_Y']);
  // An explicitly inherited blank remains authoritative; native dotenv will
  // not replace it, so a declared required key must still fail preflight.
  await assert.rejects(()=>prepareExecution(parseArgs(['exec','--prefix','DEV_','--require','DEV_Y','--','true']),
    {...f.ctx,parentEnv:{...f.ctx.parentEnv,DEV_Y:''}}),errorIs('missing_environment'));
});

test('persistent script lifecycle preserves contents, metadata prefixes, parameters and prevents overwrite',async t=>{
  const f=await fixture(t);await f.putEnv('DEV_MESSAGE=hello\n');
  const text='#!/bin/bash\n# linux-ops: prefixes=DEV_\n# linux-ops: requires=DEV_MESSAGE\nprintf "%s|%s" "$DEV_MESSAGE" "$1"\n';
  await f.putScript('hello.sh',text);
  await assert.rejects(()=>f.putScript('hello.sh',text),errorIs('already_exists'));
  const listed=await f.call(['scripts','list']);assert.equal(listed.scripts[0].name,'hello.sh');
  assert.deepEqual(listed.scripts[0].prefixes,['DEV_']);
  assert.equal((await fs.stat(path.join(f.root,'bin','hello.sh'))).mode & 0o777,0o700);
  assert.equal((await f.call(['scripts','show','hello.sh'])).source,text);
  const result=await f.cli(['run','hello.sh','--','literal ; $(touch nope)']);
  assert.equal(result.stdout,'hello|literal ; $(touch nope)');assert.equal(result.stderr,'');
  assert.equal(await fs.stat(path.join(f.cwd,'nope')).then(()=>true,()=>false),false);
  await f.putScript('hello.sh',text.replace('hello','still'),['--replace']);
  await f.call(['scripts','remove','hello.sh']);
  assert.equal((await f.call(['scripts','list'])).scripts.length,0);
});

test('script is data until run, requires shebang and rejects links and path traversal',async t=>{
  const f=await fixture(t);
  await assert.rejects(()=>f.putScript('no.sh','echo missing-shebang'),errorIs('invalid_script'));
  await f.putScript('no-run.sh','#!/bin/bash\ntouch '+path.join(f.base,'not-yet')+'\n');
  assert.equal(await fs.stat(path.join(f.base,'not-yet')).then(()=>true,()=>false),false);
  await fs.symlink(path.join(f.root,'bin','no-run.sh'),path.join(f.root,'bin','linked.sh'));
  await assert.rejects(()=>prepareExecution(parseArgs(['run','linked.sh']),f.ctx),errorIs('file_security'));
});

test('full shell pipeline/redirect/substitution, raw stdout/stderr and exit code preserved',async t=>{
  const f=await fixture(t);await f.putEnv('DEV_TOKEN=fake-unredacted-value\n');
  const r=await f.cli(['exec','--prefix','DEV_','--','printf "%s" "$DEV_TOKEN" | cat; printf err >&2; echo "$(printf redirected)" > result.txt']);
  assert.equal(r.stdout,'fake-unredacted-value');assert.equal(r.stderr,'err');
  assert.equal(await fs.readFile(path.join(f.cwd,'result.txt'),'utf8'),'redirected\n');
  await assert.rejects(()=>f.cli(['exec','--','printf out; printf failure >&2; exit 23']),e=>e.code===23 && e.stdout==='out' && e.stderr==='failure');
  assert.equal((await f.cli(['exec','--','false | true'])).stdout,''); // ordinary Bash, no forced pipefail
});

test('large/binary output untruncated and stdin delivered to command, no JSON envelope',async t=>{
  const f=await fixture(t);
  const r=await f.cli(['exec','--',`${JSON.stringify(process.execPath)} -e 'process.stdout.write(Buffer.alloc(1200000,97));process.stderr.write("end")'`]);
  assert.equal(r.stdout.length,1200000);assert.equal(r.stderr,'end');
  const input='binary\0data\n';
  const cp=spawn(process.execPath,[CLI,'--root',f.root,'exec','--','cat'],{cwd:f.cwd,env:{...process.env,HOME:f.base}});
  let out=Buffer.alloc(0);cp.stdout.on('data',b=>out=Buffer.concat([out,b]));cp.stdin.end(input);
  const code=await new Promise((resolve,reject)=>{cp.on('close',resolve);cp.on('error',reject);});
  assert.equal(code,0);assert.equal(out.toString(),input);
});

test('no fixed short timeout for long commands; opt-in timeout returns 124',async t=>{
  const f=await fixture(t);
  const r=await f.cli(['exec','--','sleep 0.15; printf done']);assert.equal(r.stdout,'done');
  await assert.rejects(()=>f.cli(['exec','--timeout','0.1','--','sleep 10']),e=>e.code===124);
});

test('cancellation forwards SIGTERM to shell process group; no orphan sleep child',async t=>{
  const f=await fixture(t);const pidfile=path.join(f.base,'sleep.pid');
  const cp=spawn(process.execPath,[CLI,'--root',f.root,'exec','--',`sleep 30 & echo $! > '${pidfile}'; wait`],{cwd:f.cwd,env:{...process.env,HOME:f.base}});
  let childPid;
  for(let i=0;i<100;i++){try{childPid=Number(await fs.readFile(pidfile,'utf8'));break;}catch{await new Promise(r=>setTimeout(r,20));}}
  assert.ok(childPid);cp.kill('SIGTERM');
  const result=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{cp.kill('SIGKILL');reject(Error('did not forward signal'));},4000);cp.on('close',code=>{clearTimeout(timer);resolve(code);});});
  assert.equal(result,143);
  const stat=await fs.readFile(`/proc/${childPid}/stat`,'utf8').catch(()=>null);
  assert.ok(!stat || stat.split(' ')[2]==='Z','descendant should be terminated');
});
