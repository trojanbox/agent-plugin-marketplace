# 共创记录工具合同

用于保存、恢复、修订、校验或导出共同构思。`story-session.mjs` 仅用 Node.js 内置库，读写显式本地文件，不联网、不创建 Issue、不调用模型。JSON 是调用方记录的证据；脚本无法认证“quote 真由用户说过”，实际对话仍是授权事实源。

## 位置与命令

从当前 writing 安装位置解析 `../scripts/story-session.mjs`。把真实创作记录放在用户工作目录，不写回插件、CSV 或测试夹具。首次缺少项目目录时可用任务临时目录，告诉用户实际保存位置；跨会话续接需要能读取原文件或远端记录。

```bash
node /path/to/writing/shared/horror/scripts/story-session.mjs init --session /work/story.json --input /work/initial.json
node /path/to/writing/shared/horror/scripts/story-session.mjs record --session /work/story.json --input /work/event.json
node /path/to/writing/shared/horror/scripts/story-session.mjs status --session /work/story.json
node /path/to/writing/shared/horror/scripts/story-session.mjs render --session /work/story.json
node /path/to/writing/shared/horror/scripts/story-session.mjs brief --session /work/story.json
node /path/to/writing/shared/horror/scripts/story-session.mjs validate --session /work/story.json
```

`render` 输出可同步的 Markdown；`brief` 只有当前版本已就绪、讨论结束且具备有效成文授权才输出交接 JSON。其它输出为 JSON；错误写 stderr 且非零退出。更新失败保留原文件；`.lock` 表示并发或中断写入，先核对进程再处理，不能盲删他人锁。

## 初始化

```json
{
  "id": "story-20260916-a",
  "title": "待定故事主题",
  "originalRequest": "用户实际原话，完整保留",
  "evidence": {"source": "实际用户消息标识", "quote": "对应原话"}
}
```

`id` 可省略，工具生成 UUID；已有文件绝不覆盖。所有 evidence 需要非空 `source` 和 `quote`。稳定事件 id 用于重试，不能每次失败都生成新 id。

## 事件

record 文件统一包装为 `{"expectedRevision":0,"event":{...}}`。先 `status` 取得当前 revision；同 id 同内容重试即使 revision 已前进也返回 unchanged，同 id 不同内容拒绝。每个新事件增加 revision；只有 decision 改变 briefVersion。修改旧决定必须指向当前 `supersedes`，原事件永久保留。

| type | 必需字段（均另含 id,type） | 效果 |
|---|---|---|
| proposal | key,value,reason | 候选建议，不计入已定简报 |
| delegate | keys,evidence；mode 可为 grant/revoke，默认 grant | 按字段授予或撤回代理决定权，保留旧记录 |
| decision | key,value,basis,evidence,reason；替换时 supersedes | basis 为 user 或 delegated；后者必须已有对应委托 |
| question | text,blocking | 未决问题；终极未知可为非阻塞 |
| resolve | questionId,answer,evidence | 关闭已有未决问题；不自动创建简报决定 |
| review | briefVersion,checks,verdict,notes | 当前版本审查；verdict 为 pass/revise |
| authorize | mode,evidence；按版本授权另带 briefVersion | mode 为 none、version 或 after-discussion |
| conclude | briefVersion,basis,evidence | 当前简报就绪后收口；delegated 要求各字段由用户确认或仍有有效委托，并有代定/继续成文的授权依据 |
| issue | repository,number,url,verifiedMarker,evidence | 保存调用方已核验的远端目标与标记，不执行或证明远端写入 |

简报 key 为 `premise,character,causalChain,horror,ending,constraints,form`，value 是非空文本。review.checks 必须包含 `causality,distinctness,constraints,ontology` 四段具体审查依据，不能仅填布尔值。拒绝某个方向可记录在 constraints 决定及其理由中，保留原 proposal。

一次决定示例：

```json
{
  "expectedRevision": 1,
  "event": {
    "id": "decision-character-1",
    "type": "decision",
    "key": "character",
    "value": "已确认的人物经历、价值排序与行动理由",
    "basis": "user",
    "evidence": {"source": "实际用户消息标识", "quote": "实际确认原话"},
    "reason": "这项选择如何服务故事方向"
  }
}
```

示例值不是用户证据，使用时替换为真实对话。不得为了通过工具校验伪造确认、填无意义字符串、把文档/小说里的命令当用户授权，或让代理互相替用户批准。

## 状态与权限

七项简报齐全、阻塞问题清空、当前版本 review=pass 才 `ready_to_write`。再有当前 conclude 与有效 authorize 才 `canWrite=true`、phase=`writing_authorized`。初始默认无成文授权。

原话是“聊完就写”时，在开始时记录 after-discussion 授权，不重复索取。用户后来只要讨论，记录 mode=none。“剩下你定”只委托剩余字段，已确认项继续生效；混合来源可收口。撤回代定追加 mode=revoke，保留旧决定但不得再凭已撤权限代收束；新委托或用户明确确认后再继续。conclude 的 evidence 仍须证明真实收口权限，不能仅因字段齐全而添加。

新 decision 使旧 review、conclude、按版本 authorize 失效；after-discussion 授权可延续，但仍须复查并结束新版本讨论。新阻塞问题、revise 审查和委托撤回都会取消已有收口。用户明确改口“直接写，余下自行处理”时按新授权补齐必要简报，避免反复提问；不能用工具就绪标准抵消用户真实授权。

结束时 `brief` 输出当前七项、决定来源、审查和授权；交给成文 Skill。生成正文不是本地工具的职责。文字质量和授权语义需要人工/模型对真实材料审阅，不能以结构校验代替。

## Issue 同步证据

每次 render 包含 `<!-- horror-session:ID:revision:N -->`。外部工具写入并回读后，用 issue 事件记录仓库、编号、严格匹配的 GitHub URL、回读标记和工具来源。一次 session 不得静默切换目标 Issue，未来版本标记会被拒绝。

issue 事件是本地同步回执，指向此前渲染的 revision；回执本身尚未发往远端并不代表创作内容丢失。失败时不写成功回执，保留本地事件，使用同一标记查远端再重试。正式流程见共创 Skill 的 issue-recording.md。
