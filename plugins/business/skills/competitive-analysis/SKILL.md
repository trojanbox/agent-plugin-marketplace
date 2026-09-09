---
name: competitive-analysis
description: "用于基于证据分析竞争格局、直接/间接竞争对手、替代方案和 status quo，并比较定位、产品、价格、客户体验、商业模式与发展方向，最终形成差异化、机会/威胁和战略含义（Strategic Implications）。适合‘竞争分析/竞品分析/我们和 X 到底差在哪/这个市场怎么打/谁是真正竞争对手’。若只需要搜集外部资料，使用 research；若只需要综合已有材料，使用 `research/knowledge-synthesis`。"
visibility: workflow
phase: analysis
optional_uses: "research/deep-research,research/knowledge-synthesis,reasoning/scientific-reasoning"
---

# Competitive Analysis

## 目标

把竞争资料转化为**可验证、可比较、能指导决策的竞争判断**：用户真正比较什么、市场有哪些竞争路线、各自优势/代价是什么、我们应强化/避开/验证什么。

## Skill Composition / 能力组合

- 缺外部证据时按需组合 `research/deep-research`；
- 用户已给多份材料需要归并时组合 `research/knowledge-synthesis`；
- 核心问题进一步变成机制/因果/证伪时组合 `reasoning/scientific-reasoning`。

这些是辅助能力；本 Skill 保留竞争决策框架和最终战略含义。

## 核心流程

1. **Decision Frame**：先明确要支持的真实决策，不做无目的竞品百科。
2. **Load Product Context**：有可靠产品上下文时读取；没有则只使用当前证据，不假装知道“我们是谁”。
3. **Competitor Set**：包括直接、间接、替代方案和 status quo。
4. **Decision Criteria**：定义用户选择时真正重要的比较维度，避免为我方定制评分标准。
5. **Evidence Collection**：需要完整证据层级、价格/产品/体验/公司信息采集规则时读取 `references/decision-and-evidence.md`。
6. **Evidence Matrix**：把“有证据、推断、未知”分开；同一维度采用可比口径。
7. **Trade-offs & Segments**：先识别不同竞争路线和适用客户，再判断优势与短板。
8. **Positioning & Trajectory**：区分当前定位和变化方向。
9. **Strategic Implications**：输出 defend / differentiate / do-not-chase / fix / reframe / watch / validate-next 等动作含义。
10. **Uncertainty**：列出会改变判断的缺失证据与验证动作。

Evidence Matrix 完成后按需读取 `references/tradeoffs-and-strategy.md` 推导取舍、定位和战略含义；正式报告结构、Artifact 和反模式见 `references/output-contract.md`。

## 完成条件

结论必须能回到证据与决策维度；未知项不能硬填；竞争优势必须说明对什么客户/场景成立；战略建议要从比较结果推导，而非先有结论再找材料。
