"""Static public art policy and negative safety tests."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("approved_validator", ROOT / "scripts/validate_approved_art.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class ApprovedArtTests(unittest.TestCase):
    def test_repository_catalog(self):
        self.assertGreaterEqual(mod.validate(), 18)

    def test_svg_active_content_rejected(self):
        for unsafe in (
            b'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            b'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.org/a.png"/></svg>',
            b'<svg xmlns="http://www.w3.org/2000/svg"><path onload="alert(1)" d="M0 0"/></svg>',
        ):
            with self.subTest(unsafe=unsafe):
                with self.assertRaises(ValueError):
                    mod.reject_if_unsafe_svg(unsafe, "unsafe.svg")

    def test_unapproved_and_nonpublic_licenses_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            images = root / "approved-art/images"
            images.mkdir(parents=True)
            (images / "test.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg"><circle cx="1" cy="1" r="1"/></svg>')
            item = {"id": "test", "path": "approved-art/images/test.svg",
                    "name": "Test", "category": "Nature", "tags": ["test"],
                    "license": "cc0", "source": "Original", "sourceUrl": "https://example.org/art",
                    "creator": "Test creator", "approved": True}
            cat = root / "approved-art/catalog.json"
            cat.write_text(json.dumps({"version": 1, "images": [item]}))
            self.assertEqual(mod.validate(root), 1)
            item["recolorable"] = True
            cat.write_text(json.dumps({"version": 1, "images": [item]}))
            self.assertEqual(mod.validate(root), 1)
            for bad in ("yes", 1, None):
                item["recolorable"] = bad
                cat.write_text(json.dumps({"version": 1, "images": [item]}))
                with self.assertRaises(ValueError):
                    mod.validate(root)
            item["recolorable"] = True
            (images / "test.png").write_bytes(b"\\x89PNG\\r\\n\\x1a\\n")
            item["path"] = "approved-art/images/test.png"
            cat.write_text(json.dumps({"version": 1, "images": [item]}))
            with self.assertRaises(ValueError):
                mod.validate(root)
            item["path"] = "approved-art/images/test.svg"
            for key, bad in (("approved", False), ("license", "by"), ("path", "https://example.org/a.png"),
                             ("category", "Unapproved"), ("sourceUrl", "http://example.org")):
                with self.subTest(key=key):
                    item[key] = bad
                    cat.write_text(json.dumps({"version": 1, "images": [item]}))
                    with self.assertRaises(ValueError):
                        mod.validate(root)
                    item[key] = {"approved": True, "license": "cc0", "path": "approved-art/images/test.svg",
                                 "category": "Nature", "sourceUrl": "https://example.org/art"}[key]


if __name__ == "__main__":
    unittest.main()
