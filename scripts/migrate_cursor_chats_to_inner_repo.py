#!/usr/bin/env python3
"""Migrate Cursor AI chats from outer ProjectBazaar folder to inner repo workspace."""

from __future__ import annotations

import json
import re
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

OUTER_WS_ID = "4eeefd5ef71032a58d4eb84b3c487292"
INNER_WS_ID = "24c4ea893e2096a030544f1cb1d8bfa1"

OUTER_FOLDER = Path(r"C:\Users\Administrator\Downloads\ProjectBazaar")
INNER_FOLDER = Path(r"C:\Users\Administrator\Downloads\ProjectBazaar\ProjectBazaar")

OUTER_PROJECT_SLUG = "c-Users-Administrator-Downloads-ProjectBazaar"
INNER_PROJECT_SLUG = "c-Users-Administrator-Downloads-ProjectBazaar-ProjectBazaar"

CURSOR_PROJECTS = Path(r"C:\Users\Administrator\.cursor\projects")
OUTER_CURSOR = CURSOR_PROJECTS / OUTER_PROJECT_SLUG
INNER_CURSOR = CURSOR_PROJECTS / INNER_PROJECT_SLUG

GLOBAL_DB = Path(
    r"C:\Users\Administrator\AppData\Roaming\Cursor\User\globalStorage\state.vscdb"
)
OUTER_WS_DB = Path(
    rf"C:\Users\Administrator\AppData\Roaming\Cursor\User\workspaceStorage\{OUTER_WS_ID}\state.vscdb"
)
INNER_WS_DB = Path(
    rf"C:\Users\Administrator\AppData\Roaming\Cursor\User\workspaceStorage\{INNER_WS_ID}\state.vscdb"
)

COPY_DIRS = ("agent-transcripts", "agent-tools", "assets", "canvases", "terminals")

WORKSPACE_CHAT_KEYS = (
    "aiService.generations",
    "aiService.prompts",
    "composer.composerData",
    "workbench.backgroundComposer.workspacePersistentData",
    "cursor/needsComposerInitialOpening",
)

_PATH_REPLACEMENTS = [
    # URL-encoded outer folder (must be before plain path variants)
    (
        "file:///c%3A/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar",
        "__INNER_URI__",
    ),
    (
        "file:///c%3A/Users/Administrator/Downloads/ProjectBazaar",
        "file:///c%3A/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar",
    ),
    ("__INNER_URI__", "file:///c%3A/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar"),
    # Windows paths
    (
        r"c:\Users\Administrator\Downloads\ProjectBazaar\ProjectBazaar",
        "__INNER_WIN__",
    ),
    (
        r"c:\Users\Administrator\Downloads\ProjectBazaar",
        r"c:\Users\Administrator\Downloads\ProjectBazaar\ProjectBazaar",
    ),
    ("__INNER_WIN__", r"c:\Users\Administrator\Downloads\ProjectBazaar\ProjectBazaar"),
    # Forward slashes
    (
        "c:/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar",
        "__INNER_FWD__",
    ),
    (
        "c:/Users/Administrator/Downloads/ProjectBazaar",
        "c:/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar",
    ),
    ("__INNER_FWD__", "c:/Users/Administrator/Downloads/ProjectBazaar/ProjectBazaar"),
    # Cursor project slug
    (INNER_PROJECT_SLUG, "__INNER_SLUG__"),
    (OUTER_PROJECT_SLUG, INNER_PROJECT_SLUG),
    ("__INNER_SLUG__", INNER_PROJECT_SLUG),
    # Workspace IDs in keys/JSON
    (OUTER_WS_ID, INNER_WS_ID),
]


def migrate_paths(text: str) -> str:
    if not text:
        return text
    for old, new in _PATH_REPLACEMENTS:
        text = text.replace(old, new)
    return text


def migrate_json_obj(obj):
    if isinstance(obj, str):
        return migrate_paths(obj)
    if isinstance(obj, list):
        return [migrate_json_obj(x) for x in obj]
    if isinstance(obj, dict):
        return {k: migrate_json_obj(v) for k, v in obj.items()}
    return obj


def backup_file(path: Path, backup_root: Path) -> Path:
    rel = path.name if path.parent.name in ("globalStorage", OUTER_WS_ID, INNER_WS_ID) else path
    dest = backup_root / f"{path.parent.name}_{path.name}.{datetime.now().strftime('%Y%m%d-%H%M%S')}.bak"
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, dest)
    return dest


def copy_tree(src: Path, dst: Path) -> int:
    if not src.exists():
        return 0
    count = 0
    dst.mkdir(parents=True, exist_ok=True)
    for item in src.rglob("*"):
        if item.is_dir():
            continue
        rel = item.relative_to(src)
        target = dst / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            continue
        try:
            shutil.copy2(item, target)
            count += 1
        except OSError as exc:
            print(f"   warning: skip {rel}: {exc}")
    return count


def rewrite_paths_in_tree(root: Path) -> int:
    updated = 0
    for path in root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".jsonl", ".json", ".txt", ".md", ".log"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        new_text = migrate_paths(text)
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            updated += 1
    return updated


def open_db(path: Path) -> sqlite3.Connection:
    con = sqlite3.connect(path)
    con.execute("PRAGMA busy_timeout = 5000")
    try:
        con.execute("PRAGMA wal_checkpoint(FULL)")
    except sqlite3.Error:
        pass
    return con


def migrate_global_db(backup_root: Path) -> None:
    backup_file(GLOBAL_DB, backup_root)
    con = open_db(GLOBAL_DB)

    row = con.execute(
        "SELECT value FROM ItemTable WHERE key = ?", ("composer.composerHeaders",)
    ).fetchone()
    if row:
        headers = json.loads(row[0])
        changed = 0
        for composer in headers.get("allComposers", []):
            ws = composer.get("workspaceIdentifier")
            if not ws or ws.get("id") != OUTER_WS_ID:
                continue
            ws["id"] = INNER_WS_ID
            if "uri" in ws:
                ws["uri"] = migrate_json_obj(ws["uri"])
            changed += 1
        con.execute(
            "UPDATE ItemTable SET value = ? WHERE key = ?",
            (json.dumps(headers, separators=(",", ":")), "composer.composerHeaders"),
        )
        print(f"  Updated {changed} composer headers to inner workspace")

    row = con.execute(
        "SELECT value FROM ItemTable WHERE key = ?", ("glass.localAgentProjects.v1",)
    ).fetchone()
    if row:
        projects = json.loads(row[0])
        changed = 0
        for project in projects:
            ws = project.get("workspace")
            if not ws or ws.get("id") != OUTER_WS_ID:
                continue
            ws["id"] = INNER_WS_ID
            if "uri" in ws:
                ws["uri"] = migrate_json_obj(ws["uri"])
            changed += 1
        con.execute(
            "UPDATE ItemTable SET value = ? WHERE key = ?",
            (json.dumps(projects, separators=(",", ":")), "glass.localAgentProjects.v1"),
        )
        print(f"  Updated {changed} glass agent projects to inner workspace")

    # Copy global keys scoped to outer workspace id -> inner workspace id
    rows = con.execute(
        "SELECT key, value FROM ItemTable WHERE key LIKE ?", (f"%{OUTER_WS_ID}%",)
    ).fetchall()
    copied = 0
    for key, value in rows:
        new_key = migrate_paths(key)
        if new_key == key:
            continue
        existing = con.execute(
            "SELECT 1 FROM ItemTable WHERE key = ?", (new_key,)
        ).fetchone()
        new_value = migrate_paths(value) if isinstance(value, str) else value
        if existing:
            con.execute(
                "UPDATE ItemTable SET value = ? WHERE key = ?", (new_value, new_key)
            )
        else:
            con.execute(
                "INSERT INTO ItemTable (key, value) VALUES (?, ?)", (new_key, new_value)
            )
        copied += 1
    print(f"  Migrated {copied} global glass/cache keys")

    con.commit()
    con.close()


def migrate_workspace_db(
    src_db: Path, dst_db: Path, backup_root: Path, label: str
) -> None:
    if not src_db.exists():
        print(f"  Skip {label}: missing {src_db}")
        return
    backup_file(dst_db, backup_root)
    src = open_db(src_db)
    dst = open_db(dst_db)

    merged = 0
    for key in WORKSPACE_CHAT_KEYS:
        row = src.execute("SELECT value FROM ItemTable WHERE key = ?", (key,)).fetchone()
        if not row:
            continue
        value = migrate_paths(row[0])
        exists = dst.execute(
            "SELECT 1 FROM ItemTable WHERE key = ?", (key,)
        ).fetchone()
        if exists:
            dst.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (value, key))
        else:
            dst.execute("INSERT INTO ItemTable (key, value) VALUES (?, ?)", (key, value))
        merged += 1

    for key, _ in src.execute(
        "SELECT key, value FROM ItemTable WHERE key LIKE 'workbench.panel.composerChatViewPane.%'"
    ).fetchall():
        row = src.execute("SELECT value FROM ItemTable WHERE key = ?", (key,)).fetchone()
        if not row:
            continue
        value = migrate_paths(row[0])
        exists = dst.execute("SELECT 1 FROM ItemTable WHERE key = ?", (key,)).fetchone()
        if exists:
            dst.execute("UPDATE ItemTable SET value = ? WHERE key = ?", (value, key))
        else:
            dst.execute("INSERT INTO ItemTable (key, value) VALUES (?, ?)", (key, value))
        merged += 1

    dst.commit()
    src.close()
    dst.close()
    print(f"  Merged {merged} {label} workspace chat keys")


def main() -> None:
    backup_root = INNER_FOLDER / ".cursor-migration-backup" / datetime.now().strftime(
        "%Y%m%d-%H%M%S"
    )
    backup_root.mkdir(parents=True, exist_ok=True)
    print(f"Backup folder: {backup_root}")

    print("\n1. Copying Cursor project data to inner slug...")
    copied_total = 0
    for name in COPY_DIRS:
        n = copy_tree(OUTER_CURSOR / name, INNER_CURSOR / name)
        print(f"   {name}: {n} new files")
        copied_total += n
    if OUTER_CURSOR.joinpath("mcps").exists():
        n = copy_tree(OUTER_CURSOR / "mcps", INNER_CURSOR / "mcps")
        print(f"   mcps: {n} new files")
        copied_total += n

    print("\n2. Rewriting paths in inner Cursor project files...")
    updated = rewrite_paths_in_tree(INNER_CURSOR)
    print(f"   Updated {updated} files")

    print("\n3. Updating global Cursor database...")
    migrate_global_db(backup_root)

    print("\n4. Merging workspace chat state into inner workspace DB...")
    migrate_workspace_db(OUTER_WS_DB, INNER_WS_DB, backup_root, "outer-to-inner")

    print("\nDone.")
    print("Close and reopen Cursor with workspace:")
    print(f"  {INNER_FOLDER}")
    print("Then open the chat history panel — your previous chats should appear.")


if __name__ == "__main__":
    main()
