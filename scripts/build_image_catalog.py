#!/usr/bin/env python3
"""Build a static, teacher-approved image gallery from images committed under logos/.
New approved images are discovered on push; no live GitHub API keys needed in browsers.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOGOS = ROOT / "logos"
CATALOG = LOGOS / "catalog.json"
METADATA = LOGOS / "gallery-metadata.json"
CATEGORIES = ("School Logos", "Robotics Teams", "FIRST Logos", "Custom Artwork")
FOLDERS = {
    "school-logos": "School Logos",
    "robotics-teams": "Robotics Teams",
    "first-logos": "FIRST Logos",
    "custom-artwork": "Custom Artwork",
}
EXT = {".png", ".jpg", ".jpeg", ".webp", ".avif"}
MAX_FILES = 300
MAX_FILE_BYTES = 8 * 1024 * 1024


def pretty_name(stem: str) -> str:
    stem = re.sub(r"\s*\(\d+\)$", "", stem)
    return re.sub(r"[_-]+", " ", stem).strip().title() or "Unnamed Image"


def infer_category(path: Path) -> str:
    relative = path.relative_to(LOGOS)
    if len(relative.parts) > 1:
        return FOLDERS.get(relative.parts[0].lower(), "Custom Artwork")
    if re.search(r"(?i)tiger|^tiger[-_]|robotics|^team[-_]", path.stem):
        return "Robotics Teams"
    if re.search(r"(?i)^fenton|school|^paw[-_]", path.stem):
        return "School Logos"
    if re.search(r"(?i)^first[-_]|^fll[-_]|^ftc[-_]|^frc[-_]", path.stem):
        return "FIRST Logos"
    return "Custom Artwork"


def read_metadata() -> dict:
    if not METADATA.is_file():
        return {}
    data = json.loads(METADATA.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or not isinstance(data.get("assets", {}), dict):
        raise ValueError("gallery-metadata.json must contain an 'assets' object")
    return data.get("assets", {})


def make_catalog(root: Path = LOGOS) -> dict:
    # An explicit argument supports tests for new uploads without touching the repository.
    metadata_file = root / "gallery-metadata.json"
    metadata = {}
    if metadata_file.is_file():
        document = json.loads(metadata_file.read_text(encoding="utf-8"))
        if not isinstance(document, dict) or not isinstance(document.get("assets", {}), dict):
            raise ValueError("Invalid gallery metadata")
        metadata = document.get("assets", {})
    paths = [p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in EXT]
    if len(paths) > MAX_FILES:
        raise ValueError(f"Limit is {MAX_FILES} approved images")
    # Prefer files without '(1)' if identical copies were uploaded.
    paths.sort(key=lambda p: (bool(re.search(r"\s*\(\d+\)$", p.stem)), str(p).casefold()))
    images, hashes = [], set()
    for path in paths:
        rel = path.relative_to(root)
        if any(part.startswith(".") for part in rel.parts) or path.is_symlink():
            continue
        size = path.stat().st_size
        if not 0 < size <= MAX_FILE_BYTES:
            raise ValueError(f"Image must be 1 byte to 8 MB: {rel}")
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in hashes:
            continue
        hashes.add(digest)
        public_path = "logos/" + rel.as_posix()
        extra = metadata.get(public_path, {})
        if not isinstance(extra, dict):
            raise ValueError(f"Metadata for {public_path} must be an object")
        category = extra.get("category")
        if not category:
            folder = rel.parts[0].lower() if len(rel.parts) > 1 else ""
            category = FOLDERS.get(folder)
            if not category:
                stem = path.stem.lower()
                category = ("Robotics Teams" if ("tiger" in stem or "robotics" in stem or stem.startswith("team-"))
                            else "School Logos" if ("fenton" in stem or "school" in stem)
                            else "FIRST Logos" if stem.startswith(("first-", "fll-", "ftc-", "frc-"))
                            else "Custom Artwork")
        if category not in CATEGORIES:
            raise ValueError(f"Invalid category in metadata for {public_path}: {category}")
        name = extra.get("name") or pretty_name(path.stem)
        if not isinstance(name, str) or not 1 <= len(name) <= 90:
            raise ValueError(f"Invalid name for {public_path}")
        tags = extra.get("tags", [])
        if not isinstance(tags, list) or len(tags) > 10 or any(not isinstance(t, str) or len(t) > 30 for t in tags):
            raise ValueError(f"Invalid tags for {public_path}")
        images.append({"path": public_path, "name": name, "category": category, "tags": tags})
    images.sort(key=lambda x: (CATEGORIES.index(x["category"]), x["name"].lower(), x["path"].lower()))
    return {"version": 1, "categories": list(CATEGORIES), "images": images}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="Validate images and metadata; do not write catalog")
    parser.add_argument("--check", action="store_true", help="Require committed catalog to match the source images")
    args = parser.parse_args()
    result = make_catalog()
    encoded = json.dumps(result, indent=2, ensure_ascii=False) + "\n"
    if args.check:
        if not CATALOG.exists() or CATALOG.read_text(encoding="utf-8") != encoded:
            raise SystemExit("Image catalog is out of date; run scripts/build_image_catalog.py")
    elif not args.validate:
        CATALOG.write_text(encoded, encoding="utf-8")
    print(f"Image gallery: {len(result['images'])} unique approved images across {len(CATEGORIES)} categories")


if __name__ == "__main__":
    main()
