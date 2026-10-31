# Fenton Image Library

The images in this public `logos/` directory are curated assets for the **Fenton Robotics Button Studio only**. The general edition at `/studio/` does not read this catalog or request these image files.

## Upload an image (teacher or repository maintainer)

1. Open the appropriate folder on GitHub:
   - [School Logos](school-logos/) — school marks and spirit artwork
   - [Robotics Teams](robotics-teams/) — team graphics
   - [FIRST Logos](first-logos/) — only official images used within FIRST's current brand guidelines
2. Choose **Add file → Upload files**, select images, and **Commit changes** to `main`. Use PNG with transparency for logos, or JPEG, WebP and AVIF for photos. Maximum 8 MB per image.
3. GitHub Actions automatically scans the files, deduplicates identical content, generates `logos/catalog.json`, and requests a GitHub Pages rebuild when the catalog changes. Refresh the Fenton editor after the deployment finishes.
4. In Button Studio, search by filename, team number or tags, or filter by category. Click a thumbnail to add it as a movable, editable image layer.

**Approval boundary:** Uploading to this public repository is the approval step. Students cannot publish images through the designer. Do not upload private student photographs, identifying information, or copyrighted artwork without permission.

### Existing root logos

Existing team graphics in `logos/` are classified as Robotics Teams using their metadata. FIRST season graphics under `logos/FIRST Logos/2026-27/` retain their season names and FIRST category when the catalog is rebuilt. Unidentified images can be excluded in metadata until reviewed.

### Optional names, categories and search terms

To rename or recategorize an existing file without moving it, create or update `logos/gallery-metadata.json`:

```json
{
  "assets": {
    "logos/logo-2.png": {
      "name": "Fenton School Emblem",
      "category": "School Logos",
      "tags": ["fenton", "school", "spirit"]
    }
  }
}
```

Valid categories: **Robotics Teams**, **FIRST Logos**, and **School Logos**. For a duplicate or unknown image, add `"exclude": true` to its metadata entry.

Images are listed automatically by the workflow—**don't edit `catalog.json` by hand**. The workflow also runs when a renamed, removed or replaced image is committed. Check [GitHub Actions](https://github.com/aspiece/button-designer/actions) if a new image doesn't appear.

### Notes

- Duplicate image bytes are listed once even if they were accidentally uploaded with a different filename.
- The gallery currently supports up to 300 unique images, 8 MB each.
- Avoid uploading SVG/HTML files; they are not indexed for security reasons.
- For uploaded design files rather than individual images, use the separate [shared design library](../designs/README.md).
