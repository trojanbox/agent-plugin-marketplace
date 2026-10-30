# 前缀注入、项目环境优先与原生 dotenv

## 三层优先级

**已继承的进程环境 > 项目原生加载器拥有的键 > 共享 `.env` 默认值。**

执行器从独立 `~/.linux-ops/.env` 读取数据，只选择 `--prefix` 或脚本头部 `prefixes=` 匹配的键。没有前缀就不注入共享值。多个前缀取并集。已有进程中同名键（包括显式空字符串）保持不变；不修改父进程的环境，不跨任务持久设置 `process.env`。

共享文件不能向子进程注入 `PATH/HOME/SHELL/BASH_ENV/ENV/NODE_OPTIONS/NODE_ENV/LD_*/DYLD_*` 等运行控制变量。它们属于父进程/命令自身的环境设置；用户可在已经授权的 Shell 命令中显式设置，不能借“共享默认凭据”悄悄改启动机制。

## 为什么需要“项目键避让”

Vite 和 Next.js 的原生 dotenv 加载器都优先已有进程环境。把共享默认值预先注入后，仅靠随后读取项目 `.env` **无法**自然保证项目文件覆盖。这已用真实 Vite 与 `@next/env` 包验证。

执行器默认 `--project-env auto`：**只在工具内部识别项目文件声明的键名，不把项目值传给 Agent，也不提前把项目值塞入子进程。** 同名共享键不再注入，由目标程序自己的加载器执行解析、插值、模式优先级等行为。无项目定义的共享键正常注入，项目仍能在原生扩展规则中引用这些默认值。

```text
共享.env: DEV_DB_HOST=shared-default   DEV_DB_PORT=5432
项目.env: DEV_DB_HOST=project-value

启动前：不注入 DEV_DB_HOST；仅注入 DEV_DB_PORT=5432
程序自身加载项目.env之后：DEV_DB_HOST=project-value
```

以上是解释机制的虚构值，实际工具不会打印项目或共享密钥原值。

## 项目文件与模式

自动检测发生在**启动时的工作目录**（默认 cwd，或 `--cwd ABS`），不向父目录递归搜密钥，不解析任意 Vite/Next 配置代码。默认探测 `.env`、`.env.local`、`.env.<mode>`、`.env.<mode>.local`。`mode` 来自 `--mode`，否则已有 `NODE_ENV`，否则 `development`。发现当前 package.json 依赖 Next 时，`test` 模式跳过 `.env.local`，与 Next 的原生规则一致。

```bash
node "$CLI" exec --cwd /home/example/app --prefix APP_ --mode development -- 'pnpm dev'
node "$CLI" exec --cwd /home/example/app --prefix APP_ --mode production -- 'pnpm build'
# 自定义模式需与实际程序一致：
node "$CLI" exec --cwd /home/example/app --prefix APP_ --mode staging -- 'pnpm vite --mode staging'
# 自定义 envDir/加载器只声明它真正会加载的文件；可重复传入：
node "$CLI" exec --cwd /home/example/app --prefix APP_ \
  --project-env config/.env --project-env config/.env.local -- 'pnpm dev'
```

**不要**用 `exec -- 'cd another-project && pnpm dev'` 期待执行器猜到 Shell 内部稍后切换的项目；请显式 `--cwd` 或 `--project-env`。某个框架在运行时动态选择未知文件、插件改了 envDir、模式没有传给执行器时，无法自动证明项目优先；需声明实际文件与模式后再执行。命令本身仍有完整 Shell 语义。

## 独立脚本没有 dotenv 加载器

`run` / `exec` 的 auto **不替目标程序读取项目变量的值**。直接使用 `process.env` / `$DEV_DB_*` 的独立脚本如果不自行加载项目 dotenv，应使用 `--project-env off` 或保存以下头部元数据：

```bash
# linux-ops: project-env=off
```

此时只保留已有进程环境、补充前缀匹配的共享默认值，不尝试项目声明避让。如果调用方已经把项目 env 导出了，仍由其已有进程值优先，不被共享值覆盖。

`--require` / 脚本头部 `requires=`：缺失且不在项目声明中才拒绝启动，显示缺失**键名**；在项目文件中声明的键暂交原生加载器处理，内部状态标记 deferred_required，不冒称已经取得正确认证值。如果原生程序不读取这些文件，必须关闭 auto 或在自己的脚本内正确加载。

## 权威资料与验证边界

- Vite 环境优先级：https://vite.dev/guide/env-and-mode
- Next.js 环境加载规则：https://nextjs.org/docs/pages/guides/environment-variables
- 项目键解析使用 Node `util.parseEnv`（无 shell 执行/变量插值）：https://nodejs.org/api/util.html#utilparseenvcontent

回归中使用临时目录、虚构变量、实际 Vite 和 `@next/env`，并经真实 `pnpm dev` 调用加载器。这个验证覆盖标准模式和 Next test 规则，不代表所有应用的自定义 dotenv 配置都会自动被发现，也没有连接真实开发/生产数据库。
