# Company Website Crawler Skill 路由与邻居边界回归样例

目标 Skill: tools/company-website-crawler
Phase: operations
状态：静态路由样例；须由宿主 Runtime 的 list / catalog / doctor 与实际 Agent 语义测试验证，不宣称此文档已运行模型评估。

| 类别 | 用户表达 | 预期路由 |
| --- | --- | --- |
| positive | 抓取这个企业官网 sitemap，挑选 20 个重要页面并保存原始正文 | tools/company-website-crawler |
| positive | 用 Firecrawl 发现公司网站 URL，DeepSeek Fetch 抓取企业资料并给我目录 | tools/company-website-crawler |
| positive | 网站没有 sitemap，用首页链接发现重要页面，失败后可以从 run 恢复 | tools/company-website-crawler |
| positive | 给企业抓取 Skill 配置 Firecrawl 和 DeepSeek API Key | tools/company-website-crawler |
| negative | 用邮箱发送这封业务邮件 | tools/email-mail |
| negative | 下载这个 YouTube 视频 | tools/youtube-download |
| negative | 检查磁盘并清理用户缓存 | tools/linux-disk-cleanup |
| negative | 在 Linux 上执行用户脚本并注入变量 | tools/linux-ops |
| conflict | 分析网站营销文案的叙事质量，同时采集企业页面原始资料 | 按真正主交付物确认，必要时顺序组合，不以 crawler 包办网站叙事分析 |
| composition | 把抓到的企业官网资料生成下一步 AI 建站规划 | 先 crawler 输出可追溯文件包，后交建站/产品规划流程 |
| multi-turn | 上一步已经选完 URL，现在继续把页面详情保存到同一个 run | 沿用 tools/company-website-crawler，执行 fetch 而非新建运行 |

最低运行检查：
- node skill-runtime.js list tools --json 应出现该 Skill，新增公开 Skill 计数变化合理。
- node skill-runtime.js skill tools/company-website-crawler 应能解析 phase、description 和路径。
- node skill-runtime.js doctor 与主仓库测试实际通过后，才可声称路由结构可用。
