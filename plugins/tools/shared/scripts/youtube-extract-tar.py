#!/usr/bin/env python3
"""Extract only pinned regular binaries from a verified FFmpeg TAR/XZ archive.

No extractall, no execution, no package installs, no filesystem paths from archive
members. The Node caller verifies the entire archive's pinned SHA-256 first.
"""
from __future__ import annotations
import json
import os
from pathlib import Path
import shutil
import sys
import tarfile

MAX_BINARY = 512 * 1024 * 1024


def extract(archive: Path, destination: Path, members: dict[str, str]) -> None:
    if not destination.is_dir() or destination.is_symlink():
        raise ValueError("Extraction directory must be a regular private directory")
    for name, member in members.items():
        if Path(name).name != name or name not in {"ffmpeg", "ffprobe"}:
            raise ValueError("Unrecognized executable destination")
        if member.startswith("/") or ".." in member.split("/"):
            raise ValueError("Unsafe pinned member path")
    found: set[str] = set()
    # Streaming mode keeps archive size independent of memory use.
    with tarfile.open(archive, mode="r|xz") as source:
        for info in source:
            wanted = next((name for name, member in members.items() if member == info.name), None)
            if wanted is None:
                continue
            if wanted in found or not info.isreg() or info.size <= 0 or info.size > MAX_BINARY:
                raise ValueError("Duplicate or invalid executable archive member")
            incoming = source.extractfile(info)
            if incoming is None:
                raise ValueError("Missing executable bytes")
            out = destination / wanted
            fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o700)
            with incoming, os.fdopen(fd, "wb") as output:
                shutil.copyfileobj(incoming, output, 1024 * 1024)
            if out.stat().st_size != info.size:
                raise ValueError("Incomplete executable member")
            found.add(wanted)
    if found != set(members):
        raise ValueError("Archive is missing the pinned executable members")


if __name__ == "__main__":
    try:
        if len(sys.argv) != 4:
            raise ValueError("Expected archive, private destination and member mapping")
        extract(Path(sys.argv[1]), Path(sys.argv[2]), json.loads(sys.argv[3]))
    except Exception as exc:
        print(f"Safe TAR extraction failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        raise SystemExit(1)
