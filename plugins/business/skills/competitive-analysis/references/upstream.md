# Upstream Reference

本地 `competitive-analysis` 主要参考并适配：

- Project: Corey Haines / Marketing Skills
- Repository: https://github.com/coreyhaines31/marketingskills
- Upstream skill: `skills/competitor-profiling/SKILL.md`
- Upstream name: `competitor-profiling`
- Observed upstream version: `2.0.1`
- License: MIT
- Copyright: Copyright (c) 2025 Corey Haines

## 保留的设计思想

- Facts over opinions；
- 所有竞品采用统一结构，保证可比性；
- 竞争信息是带日期的快照；
- 诚实呈现竞争对手优势和自身短板；
- 从定位、产品、价格、客户证据、内容/市场信号综合判断；
- 最终形成 `Competitive Implications`，而不是停在档案列表。

## 本地化调整

当前 Runtime 没有上游假设的 Firecrawl / DataForSEO 专属 MCP，也不需要为了使用该 Skill 安装它们。因此本地版本：

- 移除 Firecrawl / DataForSEO 强依赖和固定调用协议；
- 不要求默认保存 raw scrape / SEO API 数据；
- 使用当前环境可获得的等价一手资料、社区证据、用户材料和检索能力；
- 缺失的流量、SEO、backlink、review 等指标保持 `unknown`，禁止推测；
- 从“单个竞品档案”扩展到 Direct / Adjacent / Substitute / Status quo / Emerging 的竞争集合；
- 增加 Decision Frame、客户决策标准、Evidence Matrix、trade-off、trajectory 和 Strategic Implications；
- 明确与现有 `research` Skill 和 `business/product-marketing-context` 的边界；
- 默认直接回答，不自动向用户业务仓库写入竞品文件。

上游另有 `skills/competitors/SKILL.md`，主要用于 SEO / 销售场景的 Alternative / VS 页面生成。本次没有把该内容生成工作流合入 Competitive Analysis。

## License

完整 MIT License 副本见 `LICENSE-MIT.txt`。
