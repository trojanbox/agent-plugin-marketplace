#!/usr/bin/env python3
"""Local archive safety, Git workspace snapshots and patch validation."""
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
import zipfile
from pathlib import Path, PurePosixPath
from typing import Any

class WorkflowError(RuntimeError):
    pass


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


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
    parser = argparse.ArgumentParser(description="Development workspace and patch helpers")
    sub = parser.add_subparsers(dest="group", required=True)

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
