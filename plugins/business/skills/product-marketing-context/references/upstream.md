# Upstream Reference

本 Skill 基于 Corey Haines `marketingskills` 项目中的 Product Marketing Context 方法进行本地化改造。

- Repository: `https://github.com/coreyhaines31/marketingskills`
- Upstream path: `skills/product-marketing/SKILL.md`
- Upstream skill name: `product-marketing`
- Upstream version observed during integration: `2.1.0`
- Upstream blob SHA: `622eab19e823a131fe8b9d500aa53143604fad8a`
- License: MIT
- Copyright: © 2025 Corey Haines

## 保留的核心思想

- canonical context file 使用 `.agents/product-marketing.md`；
- 先检查现有 Context，再决定创建或局部更新；
- 可以从现有项目/产品材料自动起草；
- 覆盖 Product、Audience、Persona、Pain、Competition、Differentiation、Objections、Switching Dynamics、Customer Language、Brand Voice、Proof、Goals；
- 实质更新需要版本号与 Changelog。

## 本地化调整

- Skill 名改为 `product-marketing-context`，放入 Runtime 的 `business` Category；
- 明确当前 Runtime 没有跨 Skill 自动依赖 / pre-hook，不声称 Context 会自动注入其他 Skill；
- canonical path 相对于真实业务项目根目录，禁止默认写入 Runtime 自身目录；
- 自动起草从“只读 codebase”扩展为优先消费用户提供材料、当前工作区产品资料和必要的一方来源；
- 增加 `confirmed / supported / inferred / unknown` Evidence Status，区分事实、推断和缺口；
- 增加客户原话、Proof Point、竞争结论的防编造规则；
- 增加保存前 Validation Gate；
- 将文档骨架拆到 `references/context-template.md`，降低主 Skill 常驻上下文体积。

## MIT License Notice

Permission is granted under the upstream MIT License to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies, subject to retaining the copyright and permission notice. The upstream software is provided without warranty.
