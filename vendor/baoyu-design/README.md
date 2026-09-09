# baoyu-design upstream integration

This directory is the third-party source boundary for `JimLiu/baoyu-design`.

- Runtime-facing Skills live in `skills/design/`.
- The complete upstream tree is materialized into `vendor/baoyu-design/upstream/` and is intentionally outside `skills/`, so its own `SKILL.md` and internal prompts never become top-level Runtime routes.
- `UPSTREAM.json` pins the exact repository commit/tree used by the adapter.
- `project-types.snapshot.json` is a small routing snapshot used for offline contract tests; it is not a replacement for the upstream methodology.

## Hydrate

```bash
node vendor/baoyu-design/materialize-upstream.mjs
```

The script downloads the exact pinned `skills/baoyu-design/` subtree from GitHub raw content after verifying the pinned Git tree. It validates every output path before writing. Set `GITHUB_TOKEN` if your environment requires authenticated GitHub API access.

To refresh intentionally, update `UPSTREAM.json` only after reviewing the upstream diff and rerunning Runtime + semantic-routing tests.

## Verify an existing hydration

```bash
node vendor/baoyu-design/materialize-upstream.mjs --verify-only
```

Hydration requires network access. The packaged Runtime adapters can still be discovered and validated offline, but design execution that depends on upstream craft rules should wait until this exact source tree is present.
