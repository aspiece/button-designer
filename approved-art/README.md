# Teacher-reviewed public-use art

This is a **static, allowlisted collection** shown to students in the Fenton edition. The student app never searches Openverse, Wikimedia, or another live external image service. The **Public Images** category sits inside the existing Image Library, sharing its search box and category dropdown with Robotics Teams, FIRST Logos and School Logos. The app uses `approved-art/catalog.json` as an explicit allowlist and loads public images only from `approved-art/images/`. The general edition is unchanged.

## Included starter illustrations

The 18 small SVG illustrations included here were created specifically for this button designer and are made available as CC0 (to the extent rights exist). They are intentionally school-friendly and do not include personal data, brands, or photographs. This is a starter set, **not** a claim that thousands of external Openverse images have been screened.

## Artwork color options

The **18 reviewed starter SVGs** have `"recolorable": true` and show an **Original / Black / Orange / White** selector in the shared Image Library, like robotics team logos. Selected color is baked into the imported PNG layer with its transparent background intact. The color shown on the thumbnail matches the inserted art and saved/printed output. White and orange previews appear on dark preview backgrounds only (not part of the image).

**Do not automatically recolor externally sourced photographs or images with solid backgrounds.** For newly approved files, omit `recolorable` (default: false). Only reviewed transparent passive SVG artwork may be flagged `"recolorable": true`; CI validates this metadata. Color changes create a single-color silhouette, not a separate palette for each part of the illustration. Existing team and FIRST artwork follows its own rules.

## Approved student graphics — Batch 1 (November 2026)

The coach approved **12 original, transparent SVG button illustrations**: Game Controller, Robot Arm, Computer Chip, Coding Symbols, 3D Printer, Science Flask, Football, Baseball, Music Notes, Sea Turtle, Friendly Frog, and Dragonfly. They are listed in `catalog.json` under their existing school-friendly categories, so no new menu is required. All 12 were visually reviewed as a contact sheet before approval. They are original project illustrations (not imported from Openverse), designated CC0 to the extent rights exist, and support Original / Black / Orange / White coloration with transparent backgrounds. The student-facing **Public Images** gallery now contains **32 approved graphics**. Other generated candidate artwork is not published until approved.

## Adding artwork from Openverse or another public source

1. **An adult** searches [Openverse](https://openverse.org/) using the **CC0** or **Public Domain Mark (PDM)** filters, ideally for simple illustrations or icons. Openverse's `mature=false` filter helps but is **not** a substitute for human review.
2. Open the *original source page* and confirm the creator, file, and license/public-domain status. Reject ambiguous licenses, any ND/NC/SA/attribution-required files for this collection, commercial logos, sensitive topics, depictions of children/identifiable people, and artwork with embedded personal information. Be mindful that "public domain" markings can be incorrect.
3. **Visually inspect the actual full-resolution file**, including background/details, for sexual, violent, hateful, scary, or otherwise age-inappropriate content. Make sure it will print clearly at button size.
4. Download the approved image and upload **PNG, JPEG, or WebP** to `approved-art/images/` through a GitHub branch/PR. For a new SVG, inspect its source and keep only simple passive shapes (see the validator allowlist). Do **not** load raw SVG straight from Openverse without inspection and sanitization.
5. Add an entry to `catalog.json` with the exact relative path, accurate `name`, `category`, `tags`, `license` (`cc0` or `pdm`), `creator`, **source URL**, and `approved: true` **only after adult review**. Have another maintainer check the image and license in the pull request before merging.
6. CI validates the published catalog, file types, relative paths, metadata, and disallows active/external content in SVGs. Merge the reviewed PR to publish. An image dropped into the folder **without a catalog entry does not appear to students**.

**Do not upload student photos or personally identifying information to this public repository.** Local user uploads in the designer remain on the user's device and **are not screened** by this library; teachers should still supervise device uploads. Any external source may be inaccurately labeled, and manual review is the final safety step.

## Approval catalog example

```json
{
  "id": "example-frog",
  "path": "approved-art/images/example-frog.png",
  "name": "Green Frog",
  "category": "Nature",
  "tags": ["frog", "animal", "pond"],
  "license": "cc0",
  "source": "Openverse",
  "sourceUrl": "https://example.org/original-source-page",
  "creator": "Author shown on source page",
  "approved": true
}
```

The gallery is intentionally **not** auto-generated from directory contents, unlike the separately managed Fenton team-logo gallery. The approval list is the publishing boundary.
