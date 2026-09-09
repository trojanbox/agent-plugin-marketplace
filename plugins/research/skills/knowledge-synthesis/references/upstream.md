# Upstream Reference

本地 Skill 参考以下公开上游材料，并针对当前 AI Skill Runtime 做了实质性改造。

- Project: `anthropics/knowledge-work-plugins`
- Upstream skill: `enterprise-search/skills/knowledge-synthesis/SKILL.md`
- URL: https://github.com/anthropics/knowledge-work-plugins/blob/main/enterprise-search/skills/knowledge-synthesis/SKILL.md
- License: Apache License 2.0
- Local license copy: `LICENSE-APACHE-2.0.txt`
- Retrieved / adapted: 2026-08-22

## Retained ideas

- cross-source deduplication;
- theme-based clustering instead of source-by-source listing;
- claim/source attribution;
- freshness, authority and agreement as confidence inputs;
- explicit conflict surfacing;
- detail level adapted to result-set size.

## Material local changes

- made the Skill user-routable inside this Runtime instead of an internal enterprise-search helper;
- made source-bounded synthesis the default and prohibited silent research expansion;
- added Claim Ledger and claim-level evidence states;
- distinguished duplicated/derived mentions from independent corroboration;
- strengthened version/timeline preservation so newer material does not erase historical state;
- replaced a fixed source-authority hierarchy with question-dependent authority and directness;
- strengthened conflict classification and allowed unresolved conclusions;
- added prompt-injection/data-boundary handling for source content;
- made it a first-class Skill inside the consolidated `research` Category and added explicit routing boundaries with `business`;
- removed assumptions about Anthropic enterprise connectors and `~~chat` / `~~email` citation syntax in favor of host-native attribution.

The local file is modified from the upstream concept and should not be represented as the original Anthropic Skill.
