#!/usr/bin/env python3
"""Build a public reusable-button catalog from teacher-approved files in designs/.
The source files are JSON button projects or finished PNG art, never HTML or scripts.
Run: python3 scripts/build_library.py [--validate]
"""
import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT / "designs"
TARGET = FOLDER / "catalog.json"
MAX_DESIGNS = 150
MAX_BYTES = 10 * 1024 * 1024
VALID_KEY = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
COLORS = re.compile(r"^#[a-fA-F0-9]{6}$")

def title_from_filename(stem):
    return stem.replace("_", " ").replace("-", " ").title()

def build_catalog():
    entries = []
    files = sorted(
        p for p in FOLDER.iterdir()
        if p.is_file() and p.suffix.lower() in (".json", ".png")
        and p.name != "catalog.json"
    )
    if len(files) > MAX_DESIGNS:
        raise ValueError(f"At most {MAX_DESIGNS} approved designs are supported")
    for p in files:
        if not VALID_KEY.fullmatch(p.stem):
            raise ValueError(f"Rename {p.name}: use lowercase letters, numbers, dashes, underscores")
        if p.stat().st_size > MAX_BYTES:
            raise ValueError(f"File too large: {p.name}; maximum is 10 MB")
        if p.suffix.lower() == ".png":
            if p.read_bytes()[:8] != b"\x89PNG\r\n\x1a\n":
                raise ValueError(f"Not a valid PNG signature: {p.name}")
            entries.append({"id":p.stem,"kind":"image","file":"designs/"+p.name,"name":title_from_filename(p.stem),"description":"Print-ready PNG artwork","background":"#ffffff","centerLogo":"none"})
            continue
        try:
            data = json.loads(p.read_text("utf-8"))
        except (UnicodeError, json.JSONDecodeError) as exc:
            raise ValueError(f"Invalid JSON: {p.name}: {exc}") from exc
        if not isinstance(data,dict) or not isinstance(data.get("values"),dict):
            raise ValueError(f"{p.name} must be a Button Studio editable project (with values)")
        if not isinstance(data.get("layers",[]),list) or len(data.get("layers",[]))>12:
            raise ValueError(f"{p.name}: invalid or excessive image layers")
        for layer in data.get("layers",[]):
            if not isinstance(layer,dict) or not str(layer.get("data","")).startswith("data:image/"):
                raise ValueError(f"{p.name}: invalid image layer data")
        name=data.get("name") or title_from_filename(p.stem)
        description=data.get("description") or "Reusable Fenton button"
        if not isinstance(name,str) or not 1<=len(name)<=100:
            raise ValueError(f"{p.name}: title must be 1–100 characters")
        if not isinstance(description,str) or len(description)>180:
            raise ValueError(f"{p.name}: description must be at most 180 characters")
        values=data["values"]
        bg=values.get("bgColor","#ffffff")
        if not isinstance(bg,str) or not COLORS.fullmatch(bg):
            raise ValueError(f"{p.name}: background must be a 6-digit hex color")
        center=values.get("centerLogoChoice","none")
        if center not in ("none","f","paw","t"):
            center="none"
        entries.append({"id":p.stem,"kind":"project","file":"designs/"+p.name,"name":name,"description":description,"background":bg,"centerLogo":center})
    return {"version":1,"designs":entries}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--validate",action="store_true",help="Validate source files without writing the catalog")
    args=parser.parse_args()
    catalog=build_catalog()
    if not args.validate:
        TARGET.write_text(json.dumps(catalog,indent=2,ensure_ascii=False)+"\n","utf-8")
    print(f"Validated {len(catalog['designs'])} reusable designs"+(" (no files changed)" if args.validate else " and refreshed catalog.json"))

if __name__=="__main__":
    main()
