# Product Plugin · v1.1.0

一套可复用于新产品与已有产品的产品研发 Skill。先调查事实，再做产品判断；有可访问的相关源码就读取相关实现。支持按任务独立使用；新产品讨论与已有产品迭代讨论分开，规划、讨论、结论等阶段仍按明确目标路由。

| 公开入口 | 主要任务 | 示例 |
| --- | --- | --- |
| `product-planning` | 新产品整体骨架规划、定位与 MVP 草案；已有产品整体重规划 | 我想做一个新工具，先把整个产品规划一下 |
| `product-new-product-discussion` | 新产品正式讨论：广度骨架审查→整体确认→模块细化 | 在已有新产品讨论中先谈全部模块和外部关系 |
| `product-research` | 用户问题、产品现状与机会的独立调研 | 结合反馈与源码看看用户主要卡在哪里 |
| `product-discussion` | 已有产品的功能/流程迭代：现状→影响面→编号决策 | 已有产品收藏功能怎么改 |
| `product-conclusion` | 自包含的产品需求/PRD | 把已确认的产品决定整理成独立产品结论 |
| `product-experience-review` | 体验、流程、交互一致性审查 | 这个操作流程很麻烦，看看问题在哪 |
| `product-acceptance` | 对照需求核对真实交付结果 | 对照这些需求验收，缺证据的明确列出来 |

内部 `product-context-discovery` 统一管理事实调查、来源/版本、相关源码检查、增量复核和项目隔离；不作为第八个公开入口。不同产品的具体事实不会存进通用 Skill，不建立集中知识库或后台数据采集服务。

新产品先做完整功能骨架（简单产品也可用极简骨架）；已有产品的局部迭代只检查实际受影响的范围。两类正式讨论均复用同一份产品决策账本，避免重复实现与状态冲突。

## 使用与依赖

通过当前宿主安装 `product@agent-plugin-marketplace`，或使用仓库现有 Runtime：

```bash
node skill-runtime.js list product
node skill-runtime.js skill product/product-new-product-discussion
node skill-runtime.js skill product/product-discussion
node skill-runtime.js skill product/product-context-discovery
```

原生宿主只发现 `skills/` 七个公开入口，公开 Skill 通过相对路径读取同包的内部调查实现；无需宿主自动识别 `visibility` 或自动装组合依赖。只在任务需要时发现并读取已安装的 Research、Business、Development、Design 或 GitHub 能力；缺失时明确范围限制，不伪装已调用。

GitHub 不是必需运行环境。默认输出 Markdown，正式留档按当前产品配置和明确授权使用可用工具；不硬编码仓库。真实验收只使用有权限的材料/工具，没有执行证据就报告未验证。

## 职责边界

产品规划/需求/体验语义归 Product；技术调用链、架构、API/数据库设计、【开发·讨论】、【开发·结论】、实施计划和测试方案继续归 Development。竞品战略归 Business，纯外部资料检索归 Research，视觉设计稿与原型归 Design。产品验收核对实际结果，不能用测试计划代替验证。

七个 Skill 主文件只放核心流程；详细合同按需读取各自 `references/`，共同证据与权限规则集中在 `shared/references/`。方法及决定的来源映射见 [PROVENANCE.md](PROVENANCE.md)。

## 维护验证

```bash
node scripts/generate-host-manifests.mjs
node scripts/validate-host-manifests.mjs
node skill-runtime.js doctor
python3 -m unittest discover -s tests -p test_product_plugin_contract.py -v
```

路由/Gate/组合修改还要根据 `tests/product-semantic-routing-cases.csv` 逐条做语义评估，记录实际判断，不把合同静态测试当 LLM 稳定性测试。维护时才读 [迭代规则](shared/references/iteration.md)，保留真实使用反馈与针对性回归，未经授权不自动修订或发布。
