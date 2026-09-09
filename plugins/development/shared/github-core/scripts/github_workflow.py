#!/usr/bin/env python3
"""Deterministic helpers shared by the GitHub workflow skills.

The CLI handles deterministic mechanical work shared by GitHub skills: bundle layout,
IDs, manifests, hashes, handoff validation, archive safety, Git snapshots, and patch checks.
Development plans are authored directly as GitHub Issue/comment Markdown by the skills.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import textwrap
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any, Iterable

SCHEMA_VERSION = "2.0"
DEDUP_STATUSES = {"pending", "unique", "duplicate_open", "duplicate_closed", "not_required"}
SYNC_STATUSES = {"blocked_by_triage", "pending_sync", "synced", "partially_synced", "conflict", "skipped", "failed"}
KINDS = {"triage", "issue", "comment", "operation", "review", "artifact"}
PREFIXES = {"triage": "TRIAGE", "issue": "ISSUE", "comment": "COMMENT", "operation": "OP", "review": "REVIEW", "artifact": "ARTIFACT"}
DEFAULT_PATHS = {
    "triage": "triage/{id}.md",
    "issue": "issues/{id}.md",
    "comment": "comments/{parent}/{id}.md",
    "operation": "operations/{id}.md",
    "review": "review/{id}.md",
    "artifact": "artifacts/{id}.md",
}
CORE_DIR = Path(__file__).resolve().parents[1]
TEMPLATE_DIR = CORE_DIR / "templates"


class WorkflowError(RuntimeError):
    pass


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def read_json(path: Path) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise WorkflowError(f"文件不存在：{path}") from exc
    except json.JSONDecodeError as exc:
        raise WorkflowError(f"JSON 无效：{path}:{exc.lineno}:{exc.colno} {exc.msg}") from exc


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def render_template(name: str, values: dict[str, Any]) -> str:
    path = TEMPLATE_DIR / name
    if not path.is_file():
        raise WorkflowError(f"模板不存在：{path}")
    text = path.read_text(encoding="utf-8")
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", str(value))
    unresolved = sorted(set(re.findall(r"\{\{([A-Z0-9_]+)\}\}", text)))
    if unresolved:
        raise WorkflowError(f"模板 {name} 仍有未解析变量：{', '.join(unresolved)}")
    return text


def manifest_path(bundle: Path) -> Path:
    return bundle / "manifest.json"


def load_manifest(bundle: Path) -> dict[str, Any]:
    return read_json(manifest_path(bundle))


def save_manifest(bundle: Path, manifest: dict[str, Any]) -> None:
    manifest["updated_at"] = utc_now()
    write_json(manifest_path(bundle), manifest)


def validate_repository(repo: str) -> None:
    if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
        raise WorkflowError("target_repository 必须使用 owner/repository 格式")


def init_bundle(args: argparse.Namespace) -> int:
    bundle = Path(args.root).expanduser().resolve() / args.bundle_id
    validate_repository(args.repo)
    if bundle.exists() and any(bundle.iterdir()) and not args.force:
        raise WorkflowError(f"目录非空：{bundle}；如需覆盖入口文件请使用 --force")
    bundle.mkdir(parents=True, exist_ok=True)
    for dirname in ("triage", "issues", "comments", "operations", "review", "artifacts"):
        (bundle / dirname).mkdir(exist_ok=True)
    mode = args.mode
    status = "pending_sync"
    values = {
        "BUNDLE_ID": args.bundle_id,
        "TARGET_REPOSITORY": args.repo,
        "MODE": mode,
        "STATUS": status,
        "CREATED_AT": utc_now(),
    }
    (bundle / "INDEX.md").write_text(render_template("index.md", values), encoding="utf-8")
    (bundle / "relations.md").write_text(render_template("relations.md", values), encoding="utf-8")
    (bundle / "sync-log.md").write_text(render_template("sync-log.md", values), encoding="utf-8")
    manifest = {
        "schema_version": SCHEMA_VERSION,
        "bundle_id": args.bundle_id,
        "target_repository": args.repo,
        "mode": mode,
        "status": status,
        "created_at": values["CREATED_AT"],
        "updated_at": values["CREATED_AT"],
        "entries": [],
        "relations": [],
        "sync_batches": [],
    }
    write_json(manifest_path(bundle), manifest)
    print(bundle)
    return 0


def next_id(manifest: dict[str, Any], kind: str, parent: str | None = None) -> str:
    prefix = PREFIXES[kind]
    ids = []
    for entry in manifest.get("entries", []):
        if entry.get("kind") != kind:
            continue
        value = str(entry.get("handoff_id", ""))
        if kind == "comment":
            if parent and entry.get("parent_id") != parent:
                continue
            match = re.search(r"-COMMENT-(\d+)$", value) or re.fullmatch(r"COMMENT-(\d+)", value)
        else:
            match = re.fullmatch(re.escape(prefix) + r"-(\d+)(?:-[A-Z0-9-]+)?", value)
        if match:
            ids.append(int(match.group(1)))
    number = max(ids, default=0) + 1
    if kind == "comment" and parent:
        return f"{parent}-COMMENT-{number:03d}"
    return f"{prefix}-{number:03d}"


def default_dedupe(kind: str) -> str:
    return "pending" if kind == "issue" else "not_required"


def default_sync(kind: str, manifest: dict[str, Any]) -> str:
    if kind == "issue" and default_dedupe(kind) == "pending":
        return "blocked_by_triage"
    return "pending_sync"


def add_entry(args: argparse.Namespace) -> int:
    bundle = Path(args.bundle).expanduser().resolve()
    manifest = load_manifest(bundle)
    kind = args.kind
    if kind not in KINDS:
        raise WorkflowError(f"不支持的 kind：{kind}")
    if kind == "comment" and not args.parent:
        raise WorkflowError("comment 必须提供 --parent")
    handoff_id = args.id or next_id(manifest, kind, args.parent)
    if any(e.get("handoff_id") == handoff_id for e in manifest.get("entries", [])):
        raise WorkflowError(f"handoff_id 已存在：{handoff_id}")
    parent = args.parent or ""
    relpath = DEFAULT_PATHS[kind].format(id=handoff_id, parent=parent)
    path = bundle / relpath
    if path.exists() and not args.force:
        raise WorkflowError(f"文件已存在：{path}")
    body = ""
    if args.body_file:
        body = Path(args.body_file).read_text(encoding="utf-8").strip()
    template_name = {
        "triage": "triage.md",
        "issue": "issue.md",
        "comment": "comment.md",
        "operation": "operation.md",
        "review": "review.md",
        "artifact": "artifact.md",
    }[kind]
    dedupe_status = args.dedupe_status or default_dedupe(kind)
    sync_status = args.sync_status or ("blocked_by_triage" if kind == "issue" and dedupe_status == "pending" else "pending_sync")
    if dedupe_status not in DEDUP_STATUSES:
        raise WorkflowError(f"dedupe_status 无效：{dedupe_status}")
    if sync_status not in SYNC_STATUSES:
        raise WorkflowError(f"sync_status 无效：{sync_status}")
    values = {
        "HANDOFF_ID": handoff_id,
        "KIND": kind,
        "TARGET_REPOSITORY": manifest["target_repository"],
        "TITLE": args.title or handoff_id,
        "PARENT_ID": parent or "none",
        "INTENDED_OPERATION": args.operation or ("create" if kind == "issue" else "append" if kind == "comment" else "execute"),
        "DEDUPE_STATUS": dedupe_status,
        "SYNC_STATUS": sync_status,
        "BODY": body or "<!-- 在此填写经语义判断后的内容 -->",
        "CREATED_AT": utc_now(),
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(render_template(template_name, values), encoding="utf-8")
    entry = {
        "handoff_id": handoff_id,
        "kind": kind,
        "path": relpath.replace(os.sep, "/"),
        "title": args.title or handoff_id,
        "parent_id": args.parent,
        "depends_on": args.depends_on or [],
        "intended_operation": values["INTENDED_OPERATION"],
        "dedupe_status": dedupe_status,
        "sync_status": sync_status,
        "remote_issue_number": None,
        "remote_url": None,
        "last_sync_batch": None,
        "sha256": sha256_file(path),
        "created_at": values["CREATED_AT"],
        "updated_at": values["CREATED_AT"],
    }
    manifest.setdefault("entries", []).append(entry)
    save_manifest(bundle, manifest)
    print(path)
    return 0


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    end = text.find("\n---\n", 4)
    if end < 0:
        return {}
    result: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            result[key.strip()] = value.strip().strip('"')
    return result


def update_frontmatter(text: str, updates: dict[str, Any]) -> str:
    if not text.startswith("---\n"):
        raise WorkflowError("Markdown 缺少 frontmatter")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise WorkflowError("Markdown frontmatter 未闭合")
    lines = text[4:end].splitlines()
    seen: set[str] = set()
    output: list[str] = []
    for line in lines:
        if ":" not in line:
            output.append(line)
            continue
        key, _ = line.split(":", 1)
        key = key.strip()
        if key in updates:
            value = updates[key]
            if value is None:
                continue
            output.append(f"{key}: {json.dumps(value, ensure_ascii=False) if isinstance(value, str) and (':' in value or '#' in value or value.strip() != value) else value}")
            seen.add(key)
        else:
            output.append(line)
    for key, value in updates.items():
        if key in seen or value is None:
            continue
        output.append(f"{key}: {json.dumps(value, ensure_ascii=False) if isinstance(value, str) and (':' in value or '#' in value or value.strip() != value) else value}")
    return "---\n" + "\n".join(output) + text[end:]


def topo_sort(entries: list[dict[str, Any]]) -> tuple[list[str], list[str]]:
    ids = {str(e.get("handoff_id")) for e in entries}
    deps = {str(e.get("handoff_id")): set(map(str, e.get("depends_on") or [])) & ids for e in entries}
    order: list[str] = []
    ready = sorted(k for k, v in deps.items() if not v)
    while ready:
        node = ready.pop(0)
        order.append(node)
        for other in sorted(deps):
            if node in deps[other]:
                deps[other].remove(node)
                if not deps[other] and other not in order and other not in ready:
                    ready.append(other)
                    ready.sort()
    cycle = sorted(k for k, v in deps.items() if v)
    return order, cycle


def validate_bundle_data(bundle: Path, strict: bool = False) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    required = ["INDEX.md", "manifest.json", "relations.md", "sync-log.md"]
    for name in required:
        if not (bundle / name).is_file():
            errors.append(f"缺少必需文件：{name}")
    if errors and not (bundle / "manifest.json").is_file():
        return errors, warnings
    manifest = load_manifest(bundle)
    if manifest.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version 应为 {SCHEMA_VERSION}")
    try:
        validate_repository(str(manifest.get("target_repository", "")))
    except WorkflowError as exc:
        errors.append(str(exc))
    entries = manifest.get("entries")
    if not isinstance(entries, list):
        errors.append("entries 必须是数组")
        return errors, warnings
    seen: set[str] = set()
    by_id: dict[str, dict[str, Any]] = {}
    for index, entry in enumerate(entries):
        prefix = f"entries[{index}]"
        if not isinstance(entry, dict):
            errors.append(f"{prefix} 必须是对象")
            continue
        hid = str(entry.get("handoff_id", ""))
        kind = entry.get("kind")
        if not hid:
            errors.append(f"{prefix}.handoff_id 为空")
        elif hid in seen:
            errors.append(f"handoff_id 重复：{hid}")
        seen.add(hid)
        by_id[hid] = entry
        if kind not in KINDS:
            errors.append(f"{hid}: kind 无效：{kind}")
        if entry.get("dedupe_status") not in DEDUP_STATUSES:
            errors.append(f"{hid}: dedupe_status 无效")
        if entry.get("sync_status") not in SYNC_STATUSES:
            errors.append(f"{hid}: sync_status 无效")
        relpath = entry.get("path")
        if not isinstance(relpath, str) or not relpath:
            errors.append(f"{hid}: path 为空")
            continue
        path = (bundle / relpath).resolve()
        try:
            path.relative_to(bundle.resolve())
        except ValueError:
            errors.append(f"{hid}: path 越界：{relpath}")
            continue
        if not path.is_file():
            errors.append(f"{hid}: 文件不存在：{relpath}")
            continue
        text = path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        if fm.get("handoff_id") != hid:
            errors.append(f"{hid}: frontmatter handoff_id 不一致")
        if fm.get("kind") != kind:
            errors.append(f"{hid}: frontmatter kind 不一致")
        if fm.get("dedupe_status") != entry.get("dedupe_status"):
            errors.append(f"{hid}: frontmatter dedupe_status 不一致")
        if fm.get("sync_status") != entry.get("sync_status"):
            errors.append(f"{hid}: frontmatter sync_status 不一致")
        if kind == "comment" and fm.get("parent_id") != str(entry.get("parent_id")):
            errors.append(f"{hid}: frontmatter parent_id 不一致")
        if f"<!-- handoff-id: {hid} -->" not in text:
            errors.append(f"{hid}: 缺少幂等 HTML 标记")
        actual_hash = sha256_file(path)
        if entry.get("sha256") != actual_hash:
            message = f"{hid}: sha256 已变化（运行 handoff refresh-hashes）"
            (errors if strict else warnings).append(message)
        if kind == "comment":
            parent = entry.get("parent_id")
            if not parent:
                errors.append(f"{hid}: comment 缺少 parent_id")
    for hid, entry in by_id.items():
        parent = entry.get("parent_id")
        if parent and parent not in by_id:
            errors.append(f"{hid}: parent_id 不存在：{parent}")
        for dep in entry.get("depends_on") or []:
            if dep not in by_id:
                errors.append(f"{hid}: depends_on 不存在：{dep}")
    _, cycle = topo_sort(entries)
    if cycle:
        errors.append("依赖形成循环：" + ", ".join(cycle))
    if strict:
        for entry in entries:
            if entry.get("kind") == "issue" and entry.get("dedupe_status") == "pending" and entry.get("sync_status") != "blocked_by_triage":
                errors.append(f"{entry.get('handoff_id')}: 未查重 Issue 必须 blocked_by_triage")
    return errors, warnings


def validate_bundle(args: argparse.Namespace) -> int:
    bundle = Path(args.bundle).expanduser().resolve()
    errors, warnings = validate_bundle_data(bundle, args.strict)
    for item in warnings:
        print(f"WARN: {item}")
    for item in errors:
        print(f"ERROR: {item}")
    print(f"validation: {len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


def refresh_hashes(args: argparse.Namespace) -> int:
    bundle = Path(args.bundle).expanduser().resolve()
    manifest = load_manifest(bundle)
    for entry in manifest.get("entries", []):
        path = bundle / entry["path"]
        if path.is_file():
            entry["sha256"] = sha256_file(path)
            entry["updated_at"] = utc_now()
    save_manifest(bundle, manifest)
    print(manifest_path(bundle))
    return 0


def next_actions(args: argparse.Namespace) -> int:
    bundle = Path(args.bundle).expanduser().resolve()
    manifest = load_manifest(bundle)
    entries = manifest.get("entries", [])
    order, cycle = topo_sort(entries)
    if cycle:
        raise WorkflowError("依赖形成循环：" + ", ".join(cycle))
    by_id = {e["handoff_id"]: e for e in entries}
    actions = []
    for hid in order:
        entry = by_id[hid]
        if entry.get("sync_status") in {"synced", "skipped"}:
            continue
        if entry.get("kind") == "issue" and entry.get("dedupe_status") == "pending":
            action = "triage"
        else:
            action = entry.get("intended_operation", "sync")
        actions.append({
            "handoff_id": hid,
            "kind": entry.get("kind"),
            "action": action,
            "path": entry.get("path"),
            "sync_status": entry.get("sync_status"),
            "depends_on": entry.get("depends_on") or [],
        })
    if args.json:
        print(json.dumps(actions, ensure_ascii=False, indent=2))
    else:
        print("| ID | Kind | Next action | Status | Path |")
        print("|---|---|---|---|---|")
        for a in actions:
            print(f"| {a['handoff_id']} | {a['kind']} | {a['action']} | {a['sync_status']} | {a['path']} |")
    return 0


def recompute_bundle_status(manifest: dict[str, Any]) -> str:
    statuses = [entry.get("sync_status") for entry in manifest.get("entries", [])]
    if not statuses:
        return "pending_sync"
    if "conflict" in statuses:
        return "conflict"
    if all(status in {"synced", "skipped"} for status in statuses):
        return "synced"
    if any(status in {"synced", "skipped", "partially_synced"} for status in statuses):
        return "partially_synced"
    if "failed" in statuses:
        return "failed"
    return "pending_sync"


def record_sync(args: argparse.Namespace) -> int:
    bundle = Path(args.bundle).expanduser().resolve()
    manifest = load_manifest(bundle)
    match = next((e for e in manifest.get("entries", []) if e.get("handoff_id") == args.id), None)
    if not match:
        raise WorkflowError(f"未找到 handoff_id：{args.id}")
    if args.dedupe_status:
        if args.dedupe_status not in DEDUP_STATUSES:
            raise WorkflowError("dedupe_status 无效")
        match["dedupe_status"] = args.dedupe_status
    if args.sync_status not in SYNC_STATUSES:
        raise WorkflowError("sync_status 无效")
    match["sync_status"] = args.sync_status
    if args.remote_issue_number is not None:
        match["remote_issue_number"] = args.remote_issue_number
    if args.remote_url is not None:
        match["remote_url"] = args.remote_url
    if args.batch:
        match["last_sync_batch"] = args.batch
    match["updated_at"] = utc_now()
    entry_path = bundle / match["path"]
    if entry_path.is_file():
        text = entry_path.read_text(encoding="utf-8")
        text = update_frontmatter(text, {
            "dedupe_status": match.get("dedupe_status"),
            "sync_status": match.get("sync_status"),
            "remote_issue_number": match.get("remote_issue_number"),
            "remote_url": match.get("remote_url"),
            "last_sync_batch": match.get("last_sync_batch"),
            "updated_at": match.get("updated_at"),
        })
        entry_path.write_text(text, encoding="utf-8")
        match["sha256"] = sha256_file(entry_path)
    manifest["status"] = recompute_bundle_status(manifest)
    save_manifest(bundle, manifest)
    print(args.id)
    return 0


def safe_destination(root: Path, member_name: str) -> Path:
    pure = PurePosixPath(member_name.replace("\\", "/"))
    if pure.is_absolute() or ".." in pure.parts:
        raise WorkflowError(f"归档包含路径穿越：{member_name}")
    destination = (root / Path(*pure.parts)).resolve()
    try:
        destination.relative_to(root.resolve())
    except ValueError as exc:
        raise WorkflowError(f"归档成员越界：{member_name}") from exc
    return destination


def extract_archive(args: argparse.Namespace) -> int:
    source = Path(args.archive).expanduser().resolve()
    destination = Path(args.destination).expanduser().resolve()
    if destination.exists() and any(destination.iterdir()) and not args.force:
        raise WorkflowError(f"目标目录非空：{destination}")
    destination.mkdir(parents=True, exist_ok=True)
    extracted: list[str] = []
    if zipfile.is_zipfile(source):
        with zipfile.ZipFile(source) as archive:
            for info in archive.infolist():
                target = safe_destination(destination, info.filename)
                mode = (info.external_attr >> 16) & 0o170000
                if mode == stat.S_IFLNK:
                    raise WorkflowError(f"ZIP 符号链接被拒绝：{info.filename}")
                if info.is_dir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(info) as src, target.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
                extracted.append(info.filename)
    elif tarfile.is_tarfile(source):
        with tarfile.open(source) as archive:
            for member in archive.getmembers():
                target = safe_destination(destination, member.name)
                if member.issym() or member.islnk() or member.isdev() or member.isfifo():
                    raise WorkflowError(f"TAR 特殊成员被拒绝：{member.name}")
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                if not member.isfile():
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                src = archive.extractfile(member)
                if src is None:
                    raise WorkflowError(f"无法读取 TAR 成员：{member.name}")
                with src, target.open("wb") as dst:
                    shutil.copyfileobj(src, dst)
                extracted.append(member.name)
    else:
        raise WorkflowError("仅支持 ZIP 和 TAR 系列归档")
    result = {"archive": str(source), "destination": str(destination), "files": len(extracted)}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


def run(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(cmd, cwd=cwd, text=True, capture_output=True, check=check)
    except FileNotFoundError as exc:
        raise WorkflowError(f"命令不存在：{cmd[0]}") from exc
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip()
        raise WorkflowError(f"命令失败 ({exc.returncode})：{' '.join(cmd)}\n{detail}") from exc


def git_root(path: Path) -> Path:
    result = run(["git", "rev-parse", "--show-toplevel"], cwd=path)
    return Path(result.stdout.strip()).resolve()


def tree_digest(root: Path) -> tuple[str, int]:
    result = run(["git", "ls-files", "-co", "--exclude-standard", "-z"], cwd=root)
    names = sorted(filter(None, result.stdout.split("\0")))
    digest = hashlib.sha256()
    count = 0
    for name in names:
        path = root / name
        if not path.exists() or path.is_dir():
            continue
        digest.update(name.encode("utf-8", errors="surrogateescape"))
        digest.update(b"\0")
        if path.is_symlink():
            digest.update(os.readlink(path).encode("utf-8", errors="surrogateescape"))
        else:
            digest.update(bytes.fromhex(sha256_file(path)))
        digest.update(b"\0")
        count += 1
    return digest.hexdigest(), count


def workspace_snapshot(args: argparse.Namespace) -> int:
    path = Path(args.path).expanduser().resolve()
    root = git_root(path)
    head = run(["git", "rev-parse", "HEAD"], cwd=root).stdout.strip()
    branch = run(["git", "branch", "--show-current"], cwd=root).stdout.strip() or "DETACHED"
    status = run(["git", "status", "--porcelain=v1"], cwd=root).stdout.splitlines()
    digest, file_count = tree_digest(root)
    remotes_raw = run(["git", "remote", "-v"], cwd=root).stdout.splitlines()
    data = {
        "root": str(root),
        "head": head,
        "branch": branch,
        "dirty": bool(status),
        "status": status,
        "tree_sha256": digest,
        "file_count": file_count,
        "remotes": remotes_raw,
        "captured_at": utc_now(),
    }
    output = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(Path(args.output).resolve())
    else:
        print(output, end="")
    return 0


def inspect_patch_data(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8", errors="replace")
    files: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    additions = deletions = 0
    for line in text.splitlines():
        if line.startswith("diff --git "):
            match = re.match(r"diff --git a/(.+) b/(.+)", line)
            current = {"old": match.group(1) if match else None, "new": match.group(2) if match else None, "additions": 0, "deletions": 0}
            files.append(current)
        elif current is not None and line.startswith("+") and not line.startswith("+++"):
            current["additions"] += 1
            additions += 1
        elif current is not None and line.startswith("-") and not line.startswith("---"):
            current["deletions"] += 1
            deletions += 1
    return {
        "patch": str(path),
        "sha256": sha256_file(path),
        "bytes": path.stat().st_size,
        "files_changed": len(files),
        "additions": additions,
        "deletions": deletions,
        "files": files,
    }


def patch_inspect(args: argparse.Namespace) -> int:
    path = Path(args.patch).expanduser().resolve()
    print(json.dumps(inspect_patch_data(path), ensure_ascii=False, indent=2))
    return 0


def patch_check(args: argparse.Namespace) -> int:
    workspace = git_root(Path(args.workspace).expanduser().resolve())
    patch = Path(args.patch).expanduser().resolve()
    cmd = ["git", "apply", "--check"]
    if args.reverse:
        cmd.append("--reverse")
    cmd.append(str(patch))
    result = run(cmd, cwd=workspace)
    print(json.dumps({"workspace": str(workspace), "patch": str(patch), "applicable": True, "stdout": result.stdout.strip()}, ensure_ascii=False, indent=2))
    return 0


def patch_export(args: argparse.Namespace) -> int:
    workspace = git_root(Path(args.workspace).expanduser().resolve())
    output = Path(args.output).expanduser().resolve()
    base = args.base or "HEAD"
    result = run(["git", "diff", "--binary", base, "--"], cwd=workspace)
    if not result.stdout.strip():
        raise WorkflowError("没有可导出的已跟踪文件差异")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(result.stdout, encoding="utf-8")
    with tempfile.TemporaryDirectory(prefix="github-workflow-") as tempdir:
        temp = Path(tempdir) / "worktree"
        run(["git", "worktree", "add", "--detach", str(temp), base], cwd=workspace)
        try:
            run(["git", "apply", "--check", str(output)], cwd=temp)
        finally:
            run(["git", "worktree", "remove", "--force", str(temp)], cwd=workspace, check=False)
    data = inspect_patch_data(output)
    data.update({"workspace": str(workspace), "base": base, "replay_check": "passed"})
    print(json.dumps(data, ensure_ascii=False, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="GitHub workflow skill deterministic helpers")
    sub = parser.add_subparsers(dest="group", required=True)

    handoff = sub.add_parser("handoff")
    hs = handoff.add_subparsers(dest="command", required=True)
    p = hs.add_parser("init")
    p.add_argument("--root", default="github-handoff")
    p.add_argument("--bundle-id", required=True)
    p.add_argument("--repo", required=True)
    p.add_argument("--mode", choices=["offline", "read-only"], default="offline")
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=init_bundle)
    p = hs.add_parser("add")
    p.add_argument("--bundle", required=True)
    p.add_argument("--kind", choices=sorted(KINDS), required=True)
    p.add_argument("--id")
    p.add_argument("--parent")
    p.add_argument("--title")
    p.add_argument("--body-file")
    p.add_argument("--operation")
    p.add_argument("--depends-on", action="append", default=[])
    p.add_argument("--dedupe-status", choices=sorted(DEDUP_STATUSES))
    p.add_argument("--sync-status", choices=sorted(SYNC_STATUSES))
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=add_entry)
    p = hs.add_parser("validate")
    p.add_argument("--bundle", required=True)
    p.add_argument("--strict", action="store_true")
    p.set_defaults(func=validate_bundle)
    p = hs.add_parser("refresh-hashes")
    p.add_argument("--bundle", required=True)
    p.set_defaults(func=refresh_hashes)
    p = hs.add_parser("next-actions")
    p.add_argument("--bundle", required=True)
    p.add_argument("--json", action="store_true")
    p.set_defaults(func=next_actions)
    p = hs.add_parser("record-sync")
    p.add_argument("--bundle", required=True)
    p.add_argument("--id", required=True)
    p.add_argument("--sync-status", choices=sorted(SYNC_STATUSES), required=True)
    p.add_argument("--dedupe-status", choices=sorted(DEDUP_STATUSES))
    p.add_argument("--remote-issue-number", type=int)
    p.add_argument("--remote-url")
    p.add_argument("--batch")
    p.set_defaults(func=record_sync)

    archive = sub.add_parser("archive")
    ars = archive.add_subparsers(dest="command", required=True)
    p = ars.add_parser("extract")
    p.add_argument("--archive", required=True)
    p.add_argument("--destination", required=True)
    p.add_argument("--force", action="store_true")
    p.set_defaults(func=extract_archive)

    workspace = sub.add_parser("workspace")
    ws = workspace.add_subparsers(dest="command", required=True)
    p = ws.add_parser("snapshot")
    p.add_argument("--path", required=True)
    p.add_argument("--output")
    p.set_defaults(func=workspace_snapshot)

    patch = sub.add_parser("patch")
    ps = patch.add_subparsers(dest="command", required=True)
    p = ps.add_parser("inspect")
    p.add_argument("--patch", required=True)
    p.set_defaults(func=patch_inspect)
    p = ps.add_parser("check")
    p.add_argument("--workspace", required=True)
    p.add_argument("--patch", required=True)
    p.add_argument("--reverse", action="store_true")
    p.set_defaults(func=patch_check)
    p = ps.add_parser("export")
    p.add_argument("--workspace", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--base")
    p.set_defaults(func=patch_export)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return int(args.func(args))
    except WorkflowError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
