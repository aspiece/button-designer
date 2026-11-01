#!/usr/bin/env python3
"""Fail closed on the explicit teacher-approved public-use artwork manifest.

This validates formats, catalog membership, license metadata and passive SVG
content. Only a human can assess age suitability and actual source ownership.
"""
from __future__ import annotations

import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {"Robotics", "Science", "Nature", "Sports", "School", "Seasonal"}
PATH_RE = re.compile(r"^approved-art/images/[a-z0-9-]+\.(svg|png|jpe?g|webp)$")
ID_RE = re.compile(r"^[a-z0-9-]{2,60}$")
SVG_ELEMENTS = {"svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon"}
SVG_ATTRIBUTES = {
    "viewBox", "width", "height", "role", "fill", "stroke", "stroke-width",
    "stroke-linecap", "stroke-linejoin", "stroke-opacity", "fill-opacity",
    "opacity", "d", "cx", "cy", "r", "rx", "ry", "x", "y",
    "x1", "y1", "x2", "y2", "points", "transform",
}
PNG = b"\x89PNG\r\n\x1a\n"


def reject_if_unsafe_svg(blob: bytes, name: str) -> None:
    if len(blob) > 200_000:
        raise ValueError(f"{name}: SVG exceeds 200 KB")
    try:
        document = ET.fromstring(blob)
    except ET.ParseError as err:
        raise ValueError(f"{name}: invalid SVG XML: {err}") from err
    for node in document.iter():
        tag = node.tag.split("}")[-1]
        if tag not in SVG_ELEMENTS:
            raise ValueError(f"{name}: SVG element {tag!r} not permitted")
        for raw_key, value in node.attrib.items():
            key = raw_key.split("}")[-1]
            if key not in SVG_ATTRIBUTES or "}" in raw_key:
                raise ValueError(f"{name}: SVG attribute {raw_key!r} not permitted")
            if re.search(r"url\s*\(|javascript:|data:|https?://|@", value, re.I):
                raise ValueError(f"{name}: SVG must contain only passive vector geometry")
        if (node.text or "").strip() and tag not in {"svg", "g"}:
            raise ValueError(f"{name}: SVG must not contain embedded text nodes")
    if document.tag.split("}")[-1] != "svg":
        raise ValueError(f"{name}: missing SVG root")


def validate(root: Path = ROOT) -> int:
    root = root.resolve()
    folder = root / "approved-art"
    catalog_file = folder / "catalog.json"
    doc = json.loads(catalog_file.read_text(encoding="utf-8"))
    if not isinstance(doc, dict) or doc.get("version") != 1 or not isinstance(doc.get("images"), list):
        raise ValueError("Invalid approved-art catalog: expected version 1 and images list")
    entries = doc["images"]
    if len(entries) > 200:
        raise ValueError("Limit: 200 published approved art entries")
    ids, paths = set(), set()
    for item in entries:
        if not isinstance(item, dict):
            raise ValueError("Each approved art entry must be an object")
        name, path, image_id = item.get("name"), item.get("path"), item.get("id")
        if item.get("approved") is not True:
            raise ValueError(f"{path}: only images explicitly approved by an adult may be published")
        if not isinstance(image_id, str) or not ID_RE.fullmatch(image_id) or image_id in ids:
            raise ValueError(f"{path}: invalid or duplicate art ID")
        if not isinstance(path, str) or not PATH_RE.fullmatch(path) or path in paths:
            raise ValueError(f"{path}: invalid or duplicate local image path")
        if not isinstance(name, str) or not 1 <= len(name.strip()) <= 90:
            raise ValueError(f"{path}: invalid display name")
        if item.get("category") not in CATEGORIES:
            raise ValueError(f"{path}: category is not allowlisted")
        if item.get("license") not in {"cc0", "pdm"}:
            raise ValueError(f"{path}: license must be independently verified CC0 or PDM")
        if not isinstance(item.get("creator"), str) or not item["creator"].strip():
            raise ValueError(f"{path}: creator required")
        if not isinstance(item.get("source"), str) or not item["source"].strip():
            raise ValueError(f"{path}: origin/source required")
        url = item.get("sourceUrl")
        if not isinstance(url, str) or len(url) > 1000 or urlparse(url).scheme != "https" or not urlparse(url).netloc:
            raise ValueError(f"{path}: source URL must be valid HTTPS")
        tags = item.get("tags")
        if not isinstance(tags, list) or len(tags) > 10 or any(not isinstance(tag, str) or not 1 <= len(tag) <= 30 for tag in tags):
            raise ValueError(f"{path}: tags must be a short list of words")
        file = root / path
        if not file.is_file() or file.is_symlink() or file.resolve().parent != (folder / "images").resolve():
            raise ValueError(f"{path}: missing/unsafe approved asset path")
        blob = file.read_bytes()
        if not 0 < len(blob) <= 8 * 1024 * 1024:
            raise ValueError(f"{path}: image must be under 8 MB")
        extension = file.suffix.lower()
        if extension == ".svg":
            reject_if_unsafe_svg(blob, path)
        elif extension == ".png" and not blob.startswith(PNG):
            raise ValueError(f"{path}: invalid PNG signature")
        elif extension in {".jpg", ".jpeg"} and not blob.startswith(b"\xff\xd8\xff"):
            raise ValueError(f"{path}: invalid JPEG signature")
        elif extension == ".webp" and not (blob.startswith(b"RIFF") and blob[8:12] == b"WEBP"):
            raise ValueError(f"{path}: invalid WebP signature")
        ids.add(image_id)
        paths.add(path)
    return len(entries)


if __name__ == "__main__":
    try:
        count = validate()
    except (ValueError, KeyError, OSError, json.JSONDecodeError) as err:
        print(f"FAIL: approved public art: {err}", file=sys.stderr)
        raise SystemExit(1)
    print(f"PASS: {count} explicitly approved CC0/PDM images with validated local assets")
