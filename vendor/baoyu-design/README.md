# baoyu-design upstream integration

This directory is the third-party source boundary for `JimLiu/baoyu-design`.

- Runtime-facing Skills live in `plugins/design/skills/`.
- The complete upstream tree is materialized into `vendor/baoyu-design/upstream/` and is intentionally outside `plugins/`, so its own `SKILL.md` and internal prompts never become top-level Runtime routes.
- `UPSTREAM.json` pins the exact repository commit/tree used by the adapter.
- `project-types.snapshot.json` is a small routing snapshot used for contract tests; it is not a replacement for the upstream methodology.

## Offline bundle contract

The official `AI repository snapshot` workflow materializes the pinned upstream tree **before** uploading `agent-plugin-marketplace-snapshot`, then runs an offline verification pass:

```bash
node vendor/baoyu-design/materialize-upstream.mjs
node vendor/baoyu-design/materialize-upstream.mjs --verify-only
```

A valid snapshot therefore already contains `vendor/baoyu-design/upstream/` plus its `.upstream.json` marker. Runtime Design Skills consume those bundled files directly and do not require network access.

If a delivered snapshot is missing the upstream tree or verification fails, treat the artifact as incomplete/corrupt and obtain a valid snapshot. Do not silently hydrate from the network during normal Skill execution.

## Source-checkout maintenance

The materializer remains available for maintainers working from a Git checkout where generated bundle contents are not present:

```bash
node vendor/baoyu-design/materialize-upstream.mjs
```

The script downloads the exact pinned `skills/baoyu-design/` subtree from GitHub raw content after verifying the pinned Git tree. It validates every output path before writing. Set `GITHUB_TOKEN` if your environment requires authenticated GitHub API access.

To verify an existing local materialization without network access:

```bash
node vendor/baoyu-design/materialize-upstream.mjs --verify-only
```

To refresh intentionally, update `UPSTREAM.json` only after reviewing the upstream diff and rerunning Runtime tests; the next snapshot build must materialize and verify that reviewed revision before upload.
