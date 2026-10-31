# Approved Fenton Image Gallery

The images in this public `logos/` directory are approved assets for the **Fenton Robotics Button Studio only**. The general edition at `/studio/` does not read this catalog or request these image files.

## Upload an image (teacher or repository maintainer)

1. Open the appropriate folder on GitHub:
   - [School Logos](school-logos/) — school-approved marks and spirit artwork
   - [Robotics Teams](robotics-teams/) — approved team graphics
   - [FIRST Logos](first-logos/) — only official images used within FIRST's current brand guidelines
   - [Custom Artwork](custom-artwork/) — other approved event and project artwork
2. Choose **Add file → Upload files**, select images, and **Commit changes** to `main`. Use PNG with transparency for logos, or JPEG, WebP and AVIF for photos. Maximum 8 MB per image.
3. GitHub Actions automatically scans the files, deduplicates identical content, generates `logos/catalog.json`, and requests a GitHub Pages rebuild when the catalog changes. Refresh the Fenton editor after the deployment finishes.
4. In Button Studio, search by filename, team number or tags, or filter by category. Click a thumbnail to add it as a movable, editable image layer.

**Approval boundary:** Uploading to this public repository is the approval step. Students cannot publish images through the designer. Do not upload private student photographs, identifying information, or copyrighted artwork without permission.

### Existing root logos

Existing team graphics in `logos/` are automatically classified as Robotics Teams. Miscellaneous root files appear under Custom Artwork unless an explicit name or category is provided in metadata.

### Optional names, categories and search terms

To rename or recategorize an existing file without moving it, create or update `logos/gallery-metadata.json`:

```json
{
  "assets": {
    "logos/logo-2.png": {
      "name": "Approved Fenton School Logo",
      "category": "School Logos",
      "tags": ["fenton", "school", "spirit"]
    }
  }
}
```

Valid categories: **School Logos**, **Robotics Teams**, **FIRST Logos**, **Custom Artwork**.

Images are listed automatically by the workflow—**don't edit `catalog.json` by hand**. The workflow also runs when a renamed, removed or replaced image is committed. Check [GitHub Actions](https://github.com/aspiece/button-designer/actions) if a new image doesn't appear.

### Notes

- Duplicate image bytes are listed once even if they were accidentally uploaded with a different filename.
- The gallery currently supports up to 300 unique images, 8 MB each.
- Avoid uploading SVG/HTML files; they are not indexed for security reasons.
- For uploaded design files rather than individual images, use the separate [shared design library](../designs/README.md).
