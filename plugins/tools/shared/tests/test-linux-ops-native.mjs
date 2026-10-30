// Optional reproducible integration: install vite and @next/env in an isolated
// temporary directory; point LINUX_OPS_TEST_DEPS at its package.json directory.
// No production project, database, or real .env is read.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);
const CLI=fileURLToPath(new URL('../scripts/linux-ops.mjs',import.meta.url));
const dependencies=process.env.LINUX_OPS_TEST_DEPS;
const deps=dependencies?createRequire(path.join(dependencies,'package.json')):null;
function output(text){const line=text.split(/\r?\n/u).find(x=>x.startsWith('LINUX_OPS_PROBE='));assert.ok(line,text);return JSON.parse(line.slice('LINUX_OPS_PROBE='.length));}
for(const engine of ['vite','next']) {
  test(`real ${engine} loader: project .env beats shared defaults through pnpm dev`,{skip:!deps},async t=>{
    const base=await fs.mkdtemp(path.join(os.tmpdir(),'linux-ops-native-'));
    t.after(()=>fs.rm(base,{recursive:true,force:true}));
    const root=path.join(base,'ops'),project=path.join(base,'project');
    await fs.mkdir(project,{mode:0o700});
    const env={...process.env,HOME:base,DEV_EXISTING:'caller',NODE_ENV:'development'};
    await exec(process.execPath,[CLI,'--root',root,'init'],{cwd:project,env});
    await fs.writeFile(path.join(root,'.env'),[
      'DEV_LOCAL=wrong-shared','DEV_EXISTING=wrong-shared','DEV_FALLBACK=shared-default',
      'DEV_EMPTY=wrong-shared','DEV_EXPAND_BASE=shared-base','OTHER_TOKEN=do-not-inject','',
    ].join('\n'),{mode:0o600});
    await fs.writeFile(path.join(project,'.env'),'DEV_LOCAL=project-base\nDEV_EMPTY=\nDEV_EXISTING=project\nDEV_EXPANDED=${DEV_EXPAND_BASE}/suffix\n');
    await fs.writeFile(path.join(project,'.env.local'),'DEV_LOCAL=project-local\n');
    await fs.writeFile(path.join(project,'.env.development.local'),'DEV_LOCAL=project-development-local\n');
    const native=pathToFileURL(deps.resolve(engine==='vite'?'vite':'@next/env')).href;
    const load=engine==='vite'
      ? `const {loadEnv}=await import(${JSON.stringify(native)});const vars=loadEnv('development',process.cwd(),'DEV_');`
      : `const {default:loader}=await import(${JSON.stringify(native)});const vars=loader.loadEnvConfig(process.cwd(),true).combinedEnv;`;
    const probe=load+`\nconsole.log('LINUX_OPS_PROBE='+JSON.stringify(Object.fromEntries(['DEV_LOCAL','DEV_EXISTING','DEV_FALLBACK','DEV_EMPTY','DEV_EXPANDED','OTHER_TOKEN'].map(k=>[k,vars[k]??null]))));\n`;
    await fs.writeFile(path.join(project,'probe.mjs'),probe);
    await fs.writeFile(path.join(project,'package.json'),JSON.stringify({private:true,scripts:{dev:'node probe.mjs'},dependencies:engine==='next'?{next:'fixture'}:{vite:'fixture'}}));
    const wrong=await exec(process.execPath,['probe.mjs'],{cwd:project,env:{...env,DEV_LOCAL:'wrong-shared',DEV_FALLBACK:'shared-default'}});
    assert.equal(output(wrong.stdout).DEV_LOCAL,'wrong-shared','native loader alone does not override pre-injected defaults');
    const actual=await exec(process.execPath,[CLI,'--root',root,'exec','--prefix','DEV_','--mode','development','--','pnpm dev'],{cwd:project,env,timeout:30000});
    assert.deepEqual(output(actual.stdout),{
      DEV_LOCAL:'project-development-local',DEV_EXISTING:'caller',DEV_FALLBACK:'shared-default',
      DEV_EMPTY:'',DEV_EXPANDED:'shared-base/suffix',OTHER_TOKEN:null,
    });
    assert.ok(actual.stdout.includes('node probe.mjs'),'pnpm dev stdout remains intact');
    assert.ok(!actual.stdout.includes('"ok":'));
  });
}
test('real Next test-mode loader ignores .env.local while shared fallback remains available',{skip:!deps},async t=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'linux-ops-next-test-'));t.after(()=>fs.rm(base,{recursive:true,force:true}));
  const root=path.join(base,'ops'),cwd=path.join(base,'project');await fs.mkdir(cwd);
  const env={...process.env,HOME:base,NODE_ENV:'test'};
  await exec(process.execPath,[CLI,'--root',root,'init'],{cwd,env});
  await fs.writeFile(path.join(root,'.env'),'DEV_LOCAL_ONLY=shared\nDEV_TEST=shared\n',{mode:0o600});
  await fs.writeFile(path.join(cwd,'.env.local'),'DEV_LOCAL_ONLY=must-be-ignored\n');
  await fs.writeFile(path.join(cwd,'.env.test'),'DEV_TEST=project-test\n');
  await fs.writeFile(path.join(cwd,'package.json'),JSON.stringify({private:true,dependencies:{next:'fixture'}}));
  const entry=pathToFileURL(deps.resolve('@next/env')).href;
  await fs.writeFile(path.join(cwd,'probe.mjs'),`import loader from ${JSON.stringify(entry)};const v=loader.loadEnvConfig(process.cwd(),false).combinedEnv;console.log('LINUX_OPS_PROBE='+JSON.stringify({local:v.DEV_LOCAL_ONLY,test:v.DEV_TEST}));`);
  const result=await exec(process.execPath,[CLI,'--root',root,'exec','--prefix','DEV_','--mode','test','--','node probe.mjs'],{cwd,env,timeout:10000});
  assert.deepEqual(output(result.stdout),{local:'shared',test:'project-test'});
});
