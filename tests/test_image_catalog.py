#!/usr/bin/env python3
"""Unit tests for automatic gallery publication when approved files are added to GitHub."""
import json
import tempfile
import unittest
from pathlib import Path

from scripts.build_image_catalog import make_catalog


class ImageCatalogTests(unittest.TestCase):
    def test_new_uploads_auto_appear_in_correct_categories(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            assets = {
                "school-logos/fenton-logo.png": b"sample-1",
                "robotics-teams/tiger-paws.png": b"sample-2",
                "first-logos/fll-logo.jpg": b"sample-3",
                "custom-artwork/rocket.webp": b"sample-4",
                "new-event-button.avif": b"sample-5",
                "robotics-teams/tiger-paws (1).png": b"sample-2",
                "notes.txt": b"Not an image",
            }
            for path, blob in assets.items():
                target = root / path
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(blob)
            manifest = make_catalog(root)
            self.assertEqual(manifest["version"], 1)
            self.assertEqual(len(manifest["images"]), 5)
            by_path = {item["path"]: item for item in manifest["images"]}
            self.assertEqual(by_path["logos/school-logos/fenton-logo.png"]["category"], "School Logos")
            self.assertEqual(by_path["logos/robotics-teams/tiger-paws.png"]["category"], "Robotics Teams")
            self.assertEqual(by_path["logos/first-logos/fll-logo.jpg"]["category"], "FIRST Logos")
            self.assertEqual(by_path["logos/custom-artwork/rocket.webp"]["category"], "Custom Artwork")
            self.assertEqual(by_path["logos/new-event-button.avif"]["category"], "Custom Artwork")
            self.assertNotIn("logos/robotics-teams/tiger-paws (1).png", by_path)
            # Metadata is optional and overrides folder-derived categories and display name.
            (root / "gallery-metadata.json").write_text(json.dumps({"assets": {
                "logos/new-event-button.avif": {
                    "name": "School Rally Button", "category": "School Logos",
                    "tags": ["rally", "spirit"]
                }
            }}))
            edited = {item["path"]: item for item in make_catalog(root)["images"]}
            self.assertEqual(edited["logos/new-event-button.avif"]["name"], "School Rally Button")
            self.assertEqual(edited["logos/new-event-button.avif"]["category"], "School Logos")
            self.assertIn("spirit", edited["logos/new-event-button.avif"]["tags"])

    def test_reject_invalid_categories_and_oversized_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "logo.png").write_bytes(b"ok")
            (root / "gallery-metadata.json").write_text(json.dumps({"assets": {
                "logos/logo.png": {"category": "Unauthorized Category"}
            }}))
            with self.assertRaisesRegex(ValueError, "Invalid category"):
                make_catalog(root)
            (root / "gallery-metadata.json").unlink()
            (root / "logo.png").write_bytes(b"x" * (8 * 1024 * 1024 + 1))
            with self.assertRaisesRegex(ValueError, "8 MB"):
                make_catalog(root)


if __name__ == "__main__":
    unittest.main()
