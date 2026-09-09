#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.parse
import zipfile
from pathlib import Path
from typing import Any

SKILL_NAME = "git-branch-patch-bundle-export"
MAX_AGE_SECONDS = 86400
COMMON_BASES = ("main", "master", "dev", "develop", "trunk", "production", "prod", "stable")


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


def optional_string(request: dict[str, Any], key: str) -> str | None:
    value = request.get(key)
    if value is None:
        return None
    if not isinstance(value, str) or not value.strip():
        raise SkillError("invalid_field", f"{key} must be a non-empty string", {"field": key})
    return value.strip()


def bool_field(request: dict[str, Any], key: str, default: bool) -> bool:
    value = request.get(key, default)
    if not isinstance(value, bool):
        raise SkillError("invalid_field", f"{key} must be a boolean", {"field": key})
    return value


def string_list(request: dict[str, Any], key: str) -> list[str]:
    value = request.get(key, [])
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(item, str) and item.strip() for item in value):
        raise SkillError("invalid_field", f"{key} must be a list of non-empty strings", {"field": key})
    return [item.strip() for item in value]


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


def safe_branch(branch: str) -> str:
    if branch.startswith("-") or any(ch in branch for ch in ("\x00", "\n", "\r")):
        raise SkillError("invalid_branch", "branch contains unsafe characters", {"branch": branch})
    proc = subprocess.run(
        ["git", "check-ref-format", "--branch", branch],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0:
        raise SkillError("invalid_branch", "branch is not a valid Git branch name", {"branch": branch})
    return branch


def trim_stderr(stderr: str) -> str:
    stderr = stderr.strip()
    return stderr[-4000:] if len(stderr) > 4000 else stderr


def run_git(args: list[str], cwd: Path | None = None, timeout: int = 3600) -> str:
    try:
        proc = subprocess.run(
            ["git", *args],
            cwd=str(cwd) if cwd else None,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise SkillError("git_not_found", "git executable is not available") from exc
    except subprocess.TimeoutExpired as exc:
        raise SkillError("git_timeout", "git command timed out", {"args": args[:3]}) from exc
    if proc.returncode != 0:
        raise SkillError(
            "git_failed",
            "git command failed",
            {"stderr": trim_stderr(proc.stderr), "exit_code": proc.returncode, "operation": args[0] if args else "git"},
        )
    return proc.stdout.strip()


def run_git_optional(args: list[str], cwd: Path | None = None, timeout: int = 3600) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(
            ["git", *args],
            cwd=str(cwd) if cwd else None,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=False,
            timeout=timeout,
        )
    except FileNotFoundError as exc:
        raise SkillError("git_not_found", "git executable is not available") from exc
    except subprocess.TimeoutExpired as exc:
        raise SkillError("git_timeout", "git command timed out", {"args": args[:3]}) from exc


def run_git_to_file(args: list[str], output: Path, cwd: Path | None = None, timeout: int = 3600) -> None:
    try:
        with output.open("wb") as handle:
            proc = subprocess.run(
                ["git", *args],
                cwd=str(cwd) if cwd else None,
                stdout=handle,
                stderr=subprocess.PIPE,
                check=False,
                timeout=timeout,
            )
    except FileNotFoundError as exc:
        raise SkillError("git_not_found", "git executable is not available") from exc
    except subprocess.TimeoutExpired as exc:
        raise SkillError("git_timeout", "git command timed out", {"args": args[:3]}) from exc
    if proc.returncode != 0:
        stderr = proc.stderr.decode("utf-8", errors="replace")
        raise SkillError("git_failed", "git command failed", {"stderr": trim_stderr(stderr), "operation": args[0]})


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def inspect_zip(path: Path) -> list[str]:
    with zipfile.ZipFile(path) as zf:
        bad = zf.testzip()
        if bad is not None:
            raise SkillError("zip_integrity_failed", "ZIP CRC validation failed", {"entry": bad})
        return zf.namelist()


def default_remote_branch(source: str) -> str | None:
    proc = run_git_optional(["ls-remote", "--symref", source, "HEAD"], timeout=300)
    if proc.returncode != 0:
        return None
    for line in proc.stdout.splitlines():
        if line.startswith("ref: refs/heads/") and line.endswith("\tHEAD"):
            return line[len("ref: refs/heads/") : -len("\tHEAD")]
    return None


def remote_ref(branch: str) -> str:
    return f"refs/remotes/origin/{branch}"


def list_remote_branches(repo_dir: Path) -> list[str]:
    output = run_git(["for-each-ref", "--format=%(refname:strip=3)", "refs/remotes/origin"], repo_dir)
    return sorted({line.strip() for line in output.splitlines() if line.strip() and line.strip() != "HEAD"})


def ensure_branch(branch: str, branches: list[str], field: str) -> str:
    branch = safe_branch(branch)
    if branch not in branches:
        raise SkillError("branch_not_found", f"{field} does not exist on remote", {"branch": branch, "field": field})
    return branch


def stable_rank(branch: str, default_branch: str | None, user_candidates: list[str]) -> int:
    if default_branch and branch == default_branch:
        return 0
    if branch in user_candidates:
        return 1 + user_candidates.index(branch)
    if branch in COMMON_BASES:
        return 20 + COMMON_BASES.index(branch)
    if branch.startswith("release/"):
        return 40
    if branch.startswith("stable/"):
        return 41
    return 100


def candidate_names(
    branches: list[str], target: str, default_branch: str | None, user_candidates: list[str]
) -> tuple[list[str], bool]:
    ordered: list[str] = []

    def add(name: str | None) -> None:
        if name and name != target and name in branches and name not in ordered:
            ordered.append(name)

    add(default_branch)
    for name in user_candidates:
        add(safe_branch(name))
    for name in COMMON_BASES:
        add(name)
    for name in branches:
        if name.startswith("release/") or name.startswith("stable/"):
            add(name)
    fallback = False
    if not ordered:
        fallback = True
        for name in branches:
            add(name)
    return ordered, fallback


def analyze_base(
    repo_dir: Path,
    target_branch: str,
    explicit_base: str | None,
    user_candidates: list[str],
    default_branch: str | None,
) -> dict[str, Any]:
    branches = list_remote_branches(repo_dir)
    target_branch = ensure_branch(target_branch, branches, "target_branch")
    target_ref = remote_ref(target_branch)
    target_commit = run_git(["rev-parse", target_ref], repo_dir)

    if explicit_base:
        selected = ensure_branch(explicit_base, branches, "base_branch")
        candidates = [selected]
        mode = "explicit"
        fallback = False
    else:
        candidates, fallback = candidate_names(branches, target_branch, default_branch, user_candidates)
        if not candidates:
            raise SkillError("base_candidate_missing", "no base branch candidates are available")
        mode = "automatic"

    evidence: list[dict[str, Any]] = []
    for candidate in candidates:
        base_ref = remote_ref(candidate)
        proc = run_git_optional(["merge-base", target_ref, base_ref], repo_dir)
        if proc.returncode != 0 or not proc.stdout.strip():
            continue
        merge_base = proc.stdout.strip()
        target_ahead = int(run_git(["rev-list", "--count", f"{merge_base}..{target_ref}"], repo_dir))
        base_ahead = int(run_git(["rev-list", "--count", f"{merge_base}..{base_ref}"], repo_dir))
        merge_base_time = int(run_git(["show", "-s", "--format=%ct", merge_base], repo_dir))
        rank = stable_rank(candidate, default_branch, user_candidates)
        evidence.append(
            {
                "branch": candidate,
                "merge_base": merge_base,
                "merge_base_time": merge_base_time,
                "target_ahead": target_ahead,
                "base_ahead": base_ahead,
                "is_default": candidate == default_branch,
                "stable_rank": rank,
                "score": [target_ahead, rank, base_ahead, -merge_base_time, candidate],
            }
        )

    if not evidence:
        raise SkillError("merge_base_missing", "no common ancestor was found for target and candidate branches")
    evidence.sort(key=lambda item: tuple(item["score"]))
    selected = evidence[0]

    if explicit_base:
        confidence = "high"
        reason = "base_branch was provided explicitly"
    elif fallback:
        confidence = "low"
        reason = "no long-lived branch candidates were found; all remote branches were considered"
    elif len(evidence) == 1:
        confidence = "high" if selected["is_default"] or selected["stable_rank"] < 40 else "medium"
        reason = "only one viable long-lived candidate was found"
    else:
        second = evidence[1]
        if selected["target_ahead"] < second["target_ahead"]:
            confidence = "high"
            reason = "selected candidate has the nearest merge-base along target history"
        elif selected["merge_base"] == second["merge_base"]:
            confidence = "medium"
            reason = "multiple base branch names share the same merge-base; origin node is unambiguous"
        else:
            confidence = "medium"
            reason = "top candidates are close; stable/default branch priority resolved the tie"

    if selected["target_ahead"] == 0:
        raise SkillError("no_changes_after_fork", "target branch has no commits after the selected merge-base")

    return {
        "target_branch": target_branch,
        "target_ref": target_ref,
        "target_commit": target_commit,
        "selected_base_branch": selected["branch"],
        "merge_base": selected["merge_base"],
        "merge_base_time": selected["merge_base_time"],
        "target_ahead": selected["target_ahead"],
        "base_ahead": selected["base_ahead"],
        "base_inference": {
            "mode": mode,
            "confidence": confidence,
            "reason": reason,
            "default_branch": default_branch,
            "fallback_all_branches": fallback,
        },
        "candidates": evidence[:20],
        "remote_branch_count": len(branches),
    }


def prepare_repository(source: str, run_dir: Path) -> tuple[Path, str | None]:
    repo_dir = run_dir / "repo.git"
    run_git(["init", "--bare", str(repo_dir)])
    run_git(["remote", "add", "origin", source], repo_dir)
    run_git(
        ["fetch", "--filter=blob:none", "--no-tags", "--prune", "origin", "+refs/heads/*:refs/remotes/origin/*"],
        repo_dir,
    )
    return repo_dir, default_remote_branch(source)


def verify_patch(repo_dir: Path, run_dir: Path, merge_base: str, target_ref: str, patch_path: Path) -> dict[str, Any]:
    verify_dir = run_dir / "verify"
    run_git(["worktree", "add", "--detach", str(verify_dir), merge_base], repo_dir)
    try:
        run_git(["apply", "--check", "--index", str(patch_path)], verify_dir)
        run_git(["apply", "--index", str(patch_path)], verify_dir)
        applied_tree = run_git(["write-tree"], verify_dir)
        target_tree = run_git(["rev-parse", f"{target_ref}^{{tree}}"], repo_dir)
        if applied_tree != target_tree:
            raise SkillError(
                "patch_tree_mismatch",
                "patch applied successfully but resulting tree does not match target branch",
                {"applied_tree": applied_tree, "target_tree": target_tree},
            )
        return {"apply_check": "ok", "tree_match": True, "applied_tree": applied_tree, "target_tree": target_tree}
    finally:
        run_git_optional(["worktree", "remove", "--force", str(verify_dir)], repo_dir)
        run_git_optional(["worktree", "prune"], repo_dir)


def generate_bundle(
    repo_dir: Path,
    run_dir: Path,
    repo_name: str,
    analysis: dict[str, Any],
    final_path: Path,
) -> dict[str, Any]:
    origin_name = f"{repo_name}-origin.zip"
    origin_path = run_dir / origin_name
    patch_path = run_dir / "content.patch"
    bundle_path = run_dir / "bundle.zip"

    run_git(
        [
            "archive",
            "--format=zip",
            f"--prefix={repo_name}-origin/",
            "-o",
            str(origin_path),
            analysis["merge_base"],
        ],
        repo_dir,
    )
    origin_entries = inspect_zip(origin_path)
    if any(".git" in Path(name).parts for name in origin_entries):
        raise SkillError("git_metadata_present", "origin ZIP contains a .git path segment")

    run_git_to_file(
        [
            "diff",
            "--binary",
            "--full-index",
            "--find-renames",
            analysis["merge_base"],
            analysis["target_ref"],
            "--",
        ],
        patch_path,
        repo_dir,
    )
    if patch_path.stat().st_size == 0:
        raise SkillError("empty_patch", "target branch has no file-tree changes after merge-base")

    verification = verify_patch(repo_dir, run_dir, analysis["merge_base"], analysis["target_ref"], patch_path)

    with zipfile.ZipFile(bundle_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9, allowZip64=True) as zf:
        zf.write(origin_path, origin_name)
        zf.write(patch_path, "content.patch")
    bundle_entries = inspect_zip(bundle_path)
    expected = sorted([origin_name, "content.patch"])
    if sorted(bundle_entries) != expected:
        raise SkillError("bundle_members_invalid", "final ZIP members are not exactly origin ZIP and content.patch", {"members": bundle_entries})

    origin_digest = sha256_file(origin_path)
    patch_digest = sha256_file(patch_path)
    bundle_digest = sha256_file(bundle_path)
    if final_path.exists():
        final_path.unlink()
    os.replace(bundle_path, final_path)

    return {
        "archive_path": str(final_path),
        "archive_name": final_path.name,
        "size_bytes": final_path.stat().st_size,
        "sha256": bundle_digest,
        "integrity": "ok",
        "members": expected,
        "origin": {
            "name": origin_name,
            "size_bytes": origin_path.stat().st_size,
            "entry_count": len(origin_entries),
            "sha256": origin_digest,
            "contains_git_metadata": False,
        },
        "patch": {
            "name": "content.patch",
            "size_bytes": patch_path.stat().st_size,
            "sha256": patch_digest,
            "binary_safe": True,
            "full_index": True,
        },
        "verification": verification,
    }


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
        "supported_actions": ["status", "resolve", "analyze", "export"],
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


def analyze_or_export(request: dict[str, Any], export: bool) -> dict[str, Any]:
    root = skill_temp_root(request)
    cleanup = cleanup_stale(root)
    repo = require_string(request, "repo")
    target_branch = safe_branch(require_string(request, "target_branch"))
    base_branch = optional_string(request, "base_branch")
    if base_branch:
        base_branch = safe_branch(base_branch)
    base_candidates = [safe_branch(item) for item in string_list(request, "base_candidates")]
    overwrite = bool_field(request, "overwrite", False)
    source, source_type = resolve_source(repo)
    repo_name = repo_basename(source, repo)

    output_dir = root / "exports"
    run_root = root / "runs"
    output_dir.mkdir(parents=True, exist_ok=True)
    run_root.mkdir(parents=True, exist_ok=True)
    default_archive = f"{repo_name}-{slug(target_branch)}.zip"
    archive_value = request.get("archive_name", default_archive)
    if not isinstance(archive_value, str) or not archive_value.strip():
        raise SkillError("invalid_field", "archive_name must be a non-empty string")
    archive_name = validate_archive_name(archive_value.strip())
    final_path = output_dir / archive_name
    if export and final_path.exists() and not overwrite:
        raise SkillError("archive_exists", "archive already exists; set overwrite=true to replace it", {"path": str(final_path)})

    run_dir = Path(tempfile.mkdtemp(prefix="run-", dir=run_root))
    try:
        repo_dir, default_branch = prepare_repository(source, run_dir)
        analysis = analyze_base(repo_dir, target_branch, base_branch, base_candidates, default_branch)
        result: dict[str, Any] = {
            "ok": True,
            "skill_action": "export" if export else "analyze",
            "repo": repo,
            "repo_name": repo_name,
                "source_type": source_type,
            "analysis": analysis,
            "temp_root": str(root),
            "cleanup": cleanup,
        }
        if export:
            result.update(generate_bundle(repo_dir, run_dir, repo_name, analysis, final_path))
        return result
    finally:
        shutil.rmtree(run_dir, ignore_errors=True)


def main() -> None:
    try:
        request = read_request()
        action = request.get("skill_action")
        if action == "status":
            result = action_status(request)
        elif action == "resolve":
            result = action_resolve(request)
        elif action == "analyze":
            result = analyze_or_export(request, False)
        elif action == "export":
            result = analyze_or_export(request, True)
        else:
            raise SkillError("unknown_action", "skill_action must be one of: status, resolve, analyze, export")
        emit(result)
    except SkillError as exc:
        fail(exc.code, exc.message, exc.details)
    except Exception as exc:
        fail("internal_error", str(exc))


if __name__ == "__main__":
    main()
