#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import urllib.parse
import zipfile
from pathlib import Path
from typing import Any


SKILL_NAME = "git-shallow-zip-export"
MAX_AGE_SECONDS = 86400


class SkillError(Exception):
    def __init__(self, code: str, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}


def emit(payload: dict[str, Any], exit_code: int = 0) -> None:
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    raise SystemExit(exit_code)


def fail(code: str, message: str, details: dict[str, Any] | None = None) -> None:
    emit({"ok": False, "code": code, "message": message, "details": details or {}}, 1)


def read_request() -> dict[str, Any]:
    try:
        value = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        raise SkillError("invalid_json", f"stdin is not valid JSON: {exc.msg}") from exc
    if not isinstance(value, dict):
        raise SkillError("invalid_request", "stdin JSON must be an object")
    return value


def require_string(request: dict[str, Any], key: str) -> str:
    value = request.get(key)
    if not isinstance(value, str) or not value.strip():
        raise SkillError("missing_field", f"{key} must be a non-empty string", {"field": key})
    return value.strip()


def bool_field(request: dict[str, Any], key: str, default: bool) -> bool:
    value = request.get(key, default)
    if not isinstance(value, bool):
        raise SkillError("invalid_field", f"{key} must be a boolean", {"field": key})
    return value


def temp_base(request: dict[str, Any]) -> Path:
    value = request.get("temp_root")
    if value is None:
        return Path(tempfile.gettempdir()).resolve()
    if not isinstance(value, str) or not value.strip():
        raise SkillError("invalid_field", "temp_root must be a non-empty string", {"field": "temp_root"})
    return Path(value).expanduser().resolve()


def skill_temp_root(request: dict[str, Any]) -> Path:
    root = temp_base(request) / SKILL_NAME
    root.mkdir(parents=True, exist_ok=True)
    return root


def cleanup_stale(root: Path, max_age_seconds: int = MAX_AGE_SECONDS) -> dict[str, Any]:
    import time

    now = time.time()
    removed: list[str] = []
    failed: list[str] = []
    for group_name in ("runs", "exports"):
        group = root / group_name
        group.mkdir(parents=True, exist_ok=True)
        for child in group.iterdir():
            try:
                if now - child.stat().st_mtime <= max_age_seconds:
                    continue
                if child.is_dir() and not child.is_symlink():
                    shutil.rmtree(child)
                else:
                    child.unlink()
                removed.append(str(child))
            except OSError:
                failed.append(str(child))
    return {
        "max_age_seconds": max_age_seconds,
        "removed_count": len(removed),
        "failed_count": len(failed),
        "removed": removed,
        "failed": failed,
    }



def reject_embedded_credentials(source: str) -> None:
    parsed = urllib.parse.urlsplit(source)
    if parsed.scheme in {"http", "https", "ssh", "git"} and (parsed.username is not None or parsed.password is not None):
        raise SkillError("credentials_in_url", "repository URL must not contain embedded credentials")


def resolve_source(repo: str) -> tuple[str, str]:
    source = repo.strip()
    if not source:
        raise SkillError("invalid_source", "repository source is empty")
    reject_embedded_credentials(source)

    expanded = Path(source).expanduser()
    source_type = "remote"
    if expanded.is_absolute():
        if not expanded.exists():
            raise SkillError("local_source_missing", "local repository path does not exist", {"path": str(expanded)})
        source = expanded.resolve().as_uri()
        source_type = "local"
    elif source.startswith("file://"):
        source_type = "local"
    elif source.startswith("-"):
        raise SkillError("invalid_source", "repository source must not begin with '-'")
    return source, source_type


def safe_branch(branch: str) -> str:
    if branch.startswith("-") or any(ch in branch for ch in ("\x00", "\n", "\r")):
        raise SkillError("invalid_branch", "branch contains unsafe characters")
    return branch


def slug(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9._-]+", "-", value).strip("-._")
    return value or "export"


def repo_basename(source: str, original: str) -> str:
    raw = original.strip().rstrip("/")
    plain_key = "://" not in raw and not raw.startswith("git@") and "/" not in raw and ":" not in raw
    if plain_key:
        candidate = raw
    else:
        candidate = raw.rsplit("/", 1)[-1]
        if not candidate:
            candidate = source.rstrip("/").rsplit("/", 1)[-1]
        if ":" in candidate and "/" not in candidate:
            candidate = candidate.rsplit(":", 1)[-1]
    if candidate.endswith(".git"):
        candidate = candidate[:-4]
    return slug(candidate)


def validate_archive_name(name: str) -> str:
    if Path(name).name != name or name in {".", ".."} or any(ch in name for ch in ("\x00", "\n", "\r")):
        raise SkillError("invalid_archive_name", "archive_name must be a plain file name")
    if not name.lower().endswith(".zip"):
        name += ".zip"
    return name


def add_symlink(zf: zipfile.ZipFile, path: Path, arcname: str) -> None:
    target = os.readlink(path)
    info = zipfile.ZipInfo(arcname)
    info.create_system = 3
    info.external_attr = (stat.S_IFLNK | 0o777) << 16
    info.compress_type = zipfile.ZIP_DEFLATED
    zf.writestr(info, target.encode("utf-8"))


def create_zip(root: Path, output: Path, top_level: str) -> int:
    count = 0
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, allowZip64=True) as zf:
        for current, dirs, files in os.walk(root, topdown=True, followlinks=False):
            current_path = Path(current)
            kept_dirs: list[str] = []
            for directory in sorted(dirs):
                path = current_path / directory
                rel = path.relative_to(root)
                arc = str(Path(top_level) / rel)
                if path.is_symlink():
                    add_symlink(zf, path, arc)
                    count += 1
                else:
                    kept_dirs.append(directory)
            dirs[:] = kept_dirs
            for filename in sorted(files):
                path = current_path / filename
                rel = path.relative_to(root)
                arc = str(Path(top_level) / rel)
                if path.is_symlink():
                    add_symlink(zf, path, arc)
                else:
                    zf.write(path, arc)
                count += 1
    return count


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_zip(path: Path) -> tuple[int, bool]:
    with zipfile.ZipFile(path) as zf:
        bad = zf.testzip()
        if bad is not None:
            raise SkillError("zip_integrity_failed", "ZIP CRC validation failed", {"entry": bad})
        names = zf.namelist()
    contains_git = any(".git" in Path(name).parts for name in names)
    return len(names), contains_git


def run_git(args: list[str], cwd: Path | None = None) -> str:
    try:
        proc = subprocess.run(
            ["git", *args],
            cwd=str(cwd) if cwd else None,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=3600,
        )
    except FileNotFoundError as exc:
        raise SkillError("git_not_found", "git executable is not available") from exc
    except subprocess.TimeoutExpired as exc:
        raise SkillError("git_timeout", "git command timed out") from exc
    if proc.returncode != 0:
        stderr = proc.stderr.strip()
        if len(stderr) > 4000:
            stderr = stderr[-4000:]
        raise SkillError("git_failed", "git command failed", {"stderr": stderr, "exit_code": proc.returncode})
    return proc.stdout.strip()



def action_status(request: dict[str, Any]) -> dict[str, Any]:
    root = skill_temp_root(request)
    cleanup = cleanup_stale(root)
    git_path = shutil.which("git")
    return {
        "ok": True,
        "skill_action": "status",
        "git_available": git_path is not None,
        "git_path": git_path,
        "temp_root": str(root),
        "cleanup": cleanup,
        "supported_actions": ["status", "resolve", "export"],
    }


def action_resolve(request: dict[str, Any]) -> dict[str, Any]:
    root = skill_temp_root(request)
    cleanup = cleanup_stale(root)
    repo = require_string(request, "repo")
    source, source_type = resolve_source(repo)
    return {
        "ok": True,
        "skill_action": "resolve",
        "repo": repo,
        "resolved_source": source,
        "source_type": source_type,
        "temp_root": str(root),
        "cleanup": cleanup,
    }


def action_export(request: dict[str, Any]) -> dict[str, Any]:
    root = skill_temp_root(request)
    cleanup = cleanup_stale(root)
    repo = require_string(request, "repo")
    branch = safe_branch(require_string(request, "branch"))
    overwrite = bool_field(request, "overwrite", False)
    source, source_type = resolve_source(repo)

    output_dir = root / "exports"
    run_dir = root / "runs"
    output_dir.mkdir(parents=True, exist_ok=True)
    run_dir.mkdir(parents=True, exist_ok=True)

    base = repo_basename(source, repo)
    top_level = f"{base}-{slug(branch)}"
    archive_name_value = request.get("archive_name", f"{top_level}.zip")
    if not isinstance(archive_name_value, str) or not archive_name_value.strip():
        raise SkillError("invalid_field", "archive_name must be a non-empty string")
    archive_name = validate_archive_name(archive_name_value.strip())
    archive_path = output_dir / archive_name
    if archive_path.exists() and not overwrite:
        raise SkillError("archive_exists", "archive already exists; set overwrite=true to replace it", {"path": str(archive_path)})

    temp_parent = Path(tempfile.mkdtemp(prefix="run-", dir=run_dir))
    clone_dir = temp_parent / "repo"
    partial_archive = temp_parent / "archive.zip"
    try:
        run_git(["clone", "--depth", "1", "--branch", branch, "--single-branch", "--", source, str(clone_dir)])
        actual_branch = run_git(["branch", "--show-current"], clone_dir)
        commit = run_git(["rev-parse", "HEAD"], clone_dir)
        git_dir = clone_dir / ".git"
        if git_dir.is_dir():
            shutil.rmtree(git_dir)
        elif git_dir.exists():
            git_dir.unlink()

        create_zip(clone_dir, partial_archive, top_level)
        entry_count, contains_git = inspect_zip(partial_archive)
        if contains_git:
            raise SkillError("git_metadata_present", "ZIP contains a .git path segment")
        digest = sha256_file(partial_archive)
        if archive_path.exists():
            archive_path.unlink()
        os.replace(partial_archive, archive_path)
        return {
            "ok": True,
            "skill_action": "export",
            "repo": repo,
            "branch": actual_branch,
            "commit": commit,
            "archive_path": str(archive_path),
            "archive_name": archive_path.name,
            "size_bytes": archive_path.stat().st_size,
            "entry_count": entry_count,
            "sha256": digest,
            "integrity": "ok",
            "contains_git_metadata": False,
                "source_type": source_type,
            "depth": 1,
            "single_branch": True,
            "temp_root": str(root),
            "cleanup": cleanup,
        }
    finally:
        shutil.rmtree(temp_parent, ignore_errors=True)


def main() -> None:
    try:
        request = read_request()
        action = request.get("skill_action")
        if action == "status":
            result = action_status(request)
        elif action == "resolve":
            result = action_resolve(request)
        elif action == "export":
            result = action_export(request)
        else:
            raise SkillError("unknown_action", "skill_action must be one of: status, resolve, export")
        emit(result)
    except SkillError as exc:
        fail(exc.code, exc.message, exc.details)
    except Exception as exc:
        fail("internal_error", str(exc))


if __name__ == "__main__":
    main()
