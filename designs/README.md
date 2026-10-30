# Shared Fenton Robotics Button Designs

Files in this **public** folder become reusable button designs in the Button Studio website.

## Publishing a student-created design

1. In Button Studio, design the button and open **Saved team designs → Save a new design for future projects**.
2. Enter a short, descriptive name and click **Download project for shared library**. This creates a named `.json` that retains editable text, colors, layers, and image positions.
3. As a teacher or repository maintainer, review the design for approval. Don't add student names, private information, unapproved photographs, or artwork you don't have permission to publish.
4. On GitHub, navigate to the `designs/` folder. Click **Add file → Upload files**, upload one or more approved `.json` files (or finished `.png` designs), then commit to `main`.
5. The **Publish approved button designs** workflow regenerates `catalog.json` and requests a GitHub Pages build. After deployment, the new design appears in the **Saved team designs** gallery for everyone.

## File naming and limits

- Use descriptive lowercase filenames with hyphens, such as `fenton-paw-2026.json`. Only lowercase letters, numbers, underscores, and hyphens are accepted before the extension.
- Up to **150** shared designs. Each file must be no larger than **10 MB**.
- JSON projects remain editable. PNG designs are flattened; students can place a PNG as an image, or print it through the teacher print queue.
- PNGs should be the complete button artwork, not just a center logo. Use the editor's JSON format for consistent print/cut sizing across different button presses.
- The library catalog is generated automatically; **do not edit `catalog.json` by hand** after publishing.
- If auto-publishing fails, check [GitHub Actions](https://github.com/aspiece/button-designer/actions) for the build error and correct the source file.

## Privacy

GitHub Pages and this repository are public. Never publish personally identifying student projects without explicit school authorization. The student browser does not directly write to GitHub; a repository maintainer must approve and commit shared artwork.
