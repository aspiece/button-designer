# Button Studio
A standalone, privacy-conscious browser app for designing and printing custom round buttons. This is the independent **general edition**, without Fenton Robotics branding or team/school/FIRST logos.

## Features
- 14 generic starting templates, custom colors and editable text
- Searchable gallery of 42 approved public-use illustrations, with color options
- Personal image uploads processed in the browser (no upload server)
- Drag/resize/crop layers, undo/redo, mobile editing drawer and design checks
- Print Studio: actual-size US Letter PDFs, mixed designs and quantity selection
- Editable JSON files, browser save and autosave recovery
- Installable PWA with its own neutral icons, cache, and offline shell
- No student accounts, third-party analytics script, or collection of student data

## Hosting
Publish as `https://aspiece.github.io/button-studio/` using GitHub Pages.

1. Create the public **aspiece/button-studio** repository if it does not already exist.
2. Push this repository's files onto `main`.
3. Go to **Settings → Pages**, select **GitHub Actions** as the build/deployment source.
4. The included `.github/workflows/deploy.yml` publishes the static site on pushes to main.
5. Visit the site using HTTPS; check the Design, Logos, Print and Install app features.

`index.html`, all code, public images, icons, and the manifest live inside **this repository**. No shared assets are loaded from another repository. The original General Edition URL under the Fenton repository can remain available until the new site is verified.

## Testing
`node tests/smoke.cjs`. GitHub Actions also checks the files on push.

## Content and privacy
The approved catalog has 42 unbranded illustrations. The two Fenton-themed graphics were intentionally excluded, as were all team/school/FIRST assets and Umami tracking. The `license`, `source` and `sourceUrl` metadata in the catalog preserve original provenance. Uploaded images and editable projects are kept locally unless the user deliberately exports them.

## Source
This edition was extracted from the General Button Studio previously hosted under `aspiece/button-designer/studio`, with all runtime dependencies moved into this project.
