# Upstream reference — last30days

## Source

- Project: `mvanhorn/last30days-skill`
- Runtime skill: `skills/last30days/SKILL.md`
- Project: https://github.com/mvanhorn/last30days-skill
- License: MIT
- Upstream skill version observed during integration: `3.21.1`
- Integration date: 2026-08-22

## What was adopted conceptually

The local `community-research` Skill was informed by these upstream ideas:

- a recent time window as a first-class research boundary;
- community posts/comments as primary evidence for community-opinion questions;
- resolving official handles, GitHub users/repositories, sub-communities and entity aliases before broad keyword search;
- combining multiple community sources instead of relying on one platform;
- treating engagement as a ranking signal rather than proof of truth;
- separating topic research, comparisons, discovery/trending and person/project modes;
- using cross-source confirmation to distinguish strong patterns from isolated posts;
- accepting an honest “nothing solid in this window” outcome when evidence is weak.

## What was intentionally not copied

The local Runtime does not include the upstream product engine or its platform-specific operating contract. In particular, this integration does not copy or depend on:

- `scripts/last30days.py` or its Python library tree;
- Python 3.12 as a Skill requirement;
- browser-cookie extraction;
- X / TikTok / Instagram / ScrapeCreators credential setup;
- external API key configuration;
- first-run setup wizard;
- SQLite research library / topic queue;
- upstream CLI flags, badge, output LAWs, fixed response format or passthrough contract;
- discovery handoff files and engine-owned ranking implementation.

The local Skill uses the tools already available in the current host and must report source-coverage gaps honestly.

## MIT License

Copyright (c) 2026 Matt Van Horn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
