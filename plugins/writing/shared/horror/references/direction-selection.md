# 方向库与选择器

需要拓宽候选、规避近期套路或核查硬约束时读取。脚本只生成可审查的部件草案，不生成小说、不联网、不写资料库或用户历史；仅依赖 Node.js 内置模块。

## 资料库职责

`../catalogs/` 内 14 维分别覆盖：场景功能、现实压力、关系、核心恐惧、推进力量、异常机制、证据、视角、时间组织、节奏、行动选择、代价、结尾作用、日常回响。数据文件按需查询，不一次读取所有行。

统一 12 列：`id,dimension,label,family,tags,content_tags,prompt,use_when,avoid_when,risk,source_ids,provenance`。多值字段用 `|` 分隔，CSV 遵循标准引号转义；id 不随文案调整改变。`source_ids` 对应 `sources.json`，`original_synthesis` 表示研究原则启发下的原创条目，不表示论文证实了这一剧情组合。研究依据与适用边界见 `research-basis.md`，仅在核验来源或维护库时读取。

维度提供可选视角，不是每篇必须填完的槽位。默认筛选六维以方便比较，未参与的维度可自由创作；禁用内容仍覆盖完整故事。确定的现实场景可以固定，推进、选择、代价和结尾应有实质区别。

## 命令

脚本位于本资源目录旁的 `../scripts/horror-selector.mjs`，从实际安装位置解析绝对路径。示例中的 `/path/to/writing` 与 `/work` 由宿主替换；可以在任意工作目录运行，不依赖 Runtime 源码仓库。

```bash
node /path/to/writing/shared/horror/scripts/horror-selector.mjs --help
node /path/to/writing/shared/horror/scripts/horror-selector.mjs validate
node /path/to/writing/shared/horror/scripts/horror-selector.mjs list
node /path/to/writing/shared/horror/scripts/horror-selector.mjs search --request /work/search.json
node /path/to/writing/shared/horror/scripts/horror-selector.mjs select --request /work/directions.json
```

先 `list` 看维度、family 和标签词表，再按需 `search`。搜索输入如 `{"query":"责任","dimensions":["engines"],"limit":8}`。搜索结果供人判断，不代表组合已获兼容性认证。

选择输入示例（ID 与标签先从当前库确认）：

```json
{
  "seed": "story-a-round-1",
  "count": 3,
  "dimensions": ["contexts", "relationships", "engines", "choices", "costs", "endings"],
  "pins": {},
  "excludeIds": [],
  "excludeTags": [],
  "excludeFamilies": [],
  "sampleSize": 128
}
```

- `pins` 固定某维的条目 ID；显式维度清单必须包括该维。没有显式清单时，固定的可选维度会加入选择范围。
- `excludeTags` 同时检查主题与内容标签；`excludeFamilies` 优先用 `dimension:family` 限定范围，裸 family 会排除所有维度同名家族。
- 未知维度/ID/标签、冲突条件、空候选池或非法数量明确报错，不退回全集、不静默解除禁用。用户自然语言限制如果不能映射标签，必须保留在简报并人工审查，不能声称已由脚本完整过滤。
- 有界抽样耗尽不代表数学上无解；读取具体错误，扩大合法搜索预算或人工构思，不能擅自放宽硬条件。
- 相同数据、请求和 seed 可复放。默认随机 seed 会返回；保留它以便审阅。seed 改变不能替代结构检查。

## 近期记录

显式提供 `historyFile` 才比较过去作品；路径相对请求文件。格式：

```json
{
  "stories": [
    {"id": "previous-story", "families": {"engines": "当前库真实family"}, "ids": {}}
  ]
}
```

用候选结果的 `families`、`ids` 保存实际采用的结构，仅在用户要求保存后写入其工作目录。未采用候选不算已用。完全原创、无法映射到现有 family 的结构先留自然语言摘要并人工比较，不能编造库中不存在的 family。

脚本对推进力量、行动选择、代价、结尾和关系赋予较高差异权重，对场景和道具较低；历史相似度是标签重合的启发式，不是文本语义、抄袭或文学质量评分。约束固定多个核心维度时必须查看受限说明。无历史文件只代表未提供证据，不代表之前从未写过。

## 从草案到方向

每个候选补充：人物为何行动 → 行动怎样改变处境 → 结尾改变什么。逐条检查 `use_when/avoid_when/risk`；不相容就替换、舍弃或原创，拒绝机械拼接全部部件。

随后去掉人名、地点和道具再比较：如果仍是同一行动—后果—结尾链，重新设计发动机或关键选择。具体显现、人物人生、开放终极本体与日常回响仍需审查；差异再大也不能靠随机混乱维持。

讨论时让用户比较完成因果桥后的少量方向；直接写作时内部选定并写正文，不把 CSV、分数或选择命令当作默认成品。
