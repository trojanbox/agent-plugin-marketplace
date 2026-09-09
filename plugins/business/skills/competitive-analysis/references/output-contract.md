# 竞争分析输出、Artifact 与反模式

准备正式交付物、表格/文件或做最终质量检查时读取。

# Output Contract

默认输出面向决策，不输出原始搜索流水账。

## 1. Executive Takeaway

先用短段落回答：

- 市场主要竞争路线是什么；
- 最重要的差异是什么；
- 对当前 Decision Frame 的核心含义是什么。

## 2. Competitor Set

列出：

- Direct；
- Adjacent / Substitute；
- Status quo；
- Emerging（如有）。

并说明为什么这些对象属于当前竞争集合。

## 3. Comparison Matrix

只展示真正影响选择的维度。

必须允许 `unknown`、`trade-off` 和“不适用”，不要为了表格整齐填满推测。

## 4. Key Competitive Findings

按主题组织：

- Positioning；
- Product / Workflow；
- Pricing / TCO；
- Customer evidence；
- Distribution / ecosystem；
- Trajectory；
- 其他与 Decision Frame 相关的维度。

每个重要判断保持来源可追溯。

## 5. Strategic Implications

优先输出：

- Defend；
- Differentiate；
- Do Not Chase；
- Fix；
- Reframe；
- Watch；
- Validate Next。

只写有证据意义的部分，不为完整模板硬填。

## 6. Evidence Gaps / Confidence

明确：

- 当前资料不支持什么；
- 哪些结论只是 inference；
- 哪些需要后续验证。

---

# Artifact Rules

默认直接回答用户，不自动在项目中创建竞品档案目录。

只有用户明确要求保存、建立持续竞争情报库或生成文件时，才创建长期 Artifact。

若需要持久化，可采用：

```text
competitive-intelligence/
├── competitors/
│   ├── competitor-a.md
│   └── competitor-b.md
├── evidence/
│   └── YYYY-MM-DD/
└── landscape.md
```

历史快照不要覆盖；对时效敏感的数据记录观察日期。

不要把当前 Skill Runtime 根目录当成用户业务项目的 Artifact 目录。

---

# Relationship to Existing Skills

```text
research/deep-research
    → 需要系统搜集正式/市场/产品证据时

research/community-research
    → 需要了解真实用户近期评价、抱怨和社区选择时

research/knowledge-synthesis
    → 已经有大量材料，需要先去重、处理冲突时

business/product-marketing-context
    → 需要长期保存我们自己的 ICP、定位和客户语言时

business/competitive-analysis
    → 把这些证据转成竞争格局和决策含义
```

这是能力边界说明，不代表 Runtime 会自动串联这些 Skill。

---

# Anti-Patterns

禁止：

- 只做 feature checklist 就宣布赢家；
- 用 SWOT 四格代替真实竞争分析；
- 对不同竞品采用不同研究深度再横向比较；
- 把 vendor claim 当成独立验证事实；
- 把社交媒体热度当成市场份额；
- 把搜索排名当成真实竞争关系；
- 把“缺少公开信息”写成“能力不存在”；
- 把自家 roadmap 当成当前优势；
- 伪造流量、SEO、客户、价格、review、功能或市场份额；
- 为了产生“机会”而忽略没有客户需求证据的可能性；
- 在没有权重依据时生成伪精确总分；
- 隐藏竞争对手真实优势或自己的关键短板。
