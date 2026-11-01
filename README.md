# Fenton Robotics Button Studio

A browser-based multi-size round button designer for Fenton Robotics students. [Launch the designer](https://fentonbuttons.geneseelearninglab.com/).

## Two Button Studio editions

- **Fenton Robotics edition:** https://fentonbuttons.geneseelearninglab.com/ — has Fenton colors, preloaded team logos, and the approved shared team-design library.
- **General edition:** https://fentonbuttons.geneseelearninglab.com/studio/ — neutral templates, no Fenton images or team library, and a separate local save. The general page uses the same underlying editing, cropping, sizing and PDF code.

Both URLs currently live in this GitHub Pages repository. Creating a truly separate `aspiece/button-studio` repository requires a one-time GitHub repo creation step that is not available through the connected GitHub tools. See [General edition setup](studio/README.md).

## Features

- **14 Fenton starting templates:** Orange Solid, Black Solid, White & Orange, Orange + Black Ring, Black + Orange Ring, Orange / Black Split, Titanium Dark, Tiger Stripes, Paw Pattern, Hex Tech, Radial Burst, Clean White, Dark Minimal, and Blank Light. The separate General edition has six neutral templates.
- Change background, top/bottom curved text, middle text, fonts, border style and border color (black, white, orange).
- Add image layers from the approved team/FIRST gallery or your own uploaded artwork. The obsolete hidden Fenton center-logo picker and size slider have been removed. General edition keeps its own preset-symbol control.
- Add Fenton team logos from the files already uploaded to `logos/`: Tiger Paws (24471), Tiger Cubs (29168), Tiger Kits (31558), Tiger Claws (31575), Tiger Eyes (31577), Siberian Tigers (38050), Bengal Tigers (52545), Tungsten Tigers, Chromium Tigers, and Iridium Tigers.
- Drag-and-drop multiple PNG/JPEG/WebP/AVIF images onto the button. Select a layer to move, crop, resize, center or remove it.
- Export a button PNG or a **US Letter, actual-size PDF** of repeated button designs.
- Save and restore the design using browser storage, or **download/open an editable JSON project file** to back up work outside the browser.
- No login, paid backend, or account required. Artwork processing is in-browser.

## Interactive editor — Phase 1

The Fenton editor starts with **14 picture-based template cards** (the General edition has six). Choose a design and tap any text or graphic on the button to edit it. The selection panel shows only the relevant controls:

- **Top and bottom curved text:** change words, adjust size, drag the ring slightly to reposition it, or use the orange handle to resize.
- **Center text:** edit, drag, resize, center, or remove it.
- **Curved text in Beginner mode:** the Main and Bottom text fields are always visible, with live character counters and warnings when text becomes too small for printing or approaches the border.
- **Uploaded/team images:** tap one to select it, drag to move, drag the orange corner handle to resize, crop, change layer order, or remove it.
- **Larger center artwork:** uploaded image layers enlarge up to **180%**. Use the image slider or drag the orange corner handle. Artwork past the cut circle is clipped in the PDF; Print Studio warns when images cross the safe area.
- **Background:** change background and border colors.
- **Keyboard canvas:** focus the canvas, press Enter or ] for the next layer, [ for the previous layer, and use arrow keys to reposition selected text/images (Shift + arrow for larger steps). Tab continues normal keyboard focus. Undo/Redo feedback is separate from the selected-layer announcement. Up to 35 design changes are retained.

The **All design settings · advanced** section contains precise controls; curved top/bottom fields remain visible in Beginner. Switching templates changes their styling without clearing user text, text positions or image layers. PNG/PDF outputs never include editing handles. Editable JSON project files now retain curved-text positions and center-logo placement.

**Preview-first on every screen:** Phones, tablets, laptops and desktops place the editable circular button immediately beneath the editing tabs and heading, with Undo/Redo and layer status below. A compact header and viewport-height-aware preview reduce scrolling while preserving the canvas aspect ratio, interactive editing and actual-size PDF/print output. Desktop settings remain in the adjacent column; short browser windows scale the preview down rather than clipping it.

## Phase 2: Find and arrange team logos

- **Beginner / Advanced** buttons keep precise configuration out of the way until students want it.
- A **thumbnail library** shows all ten named Fenton team PNG files already available in `logos/`, grouped by numbered teams and Titanium Tigers teams.
- **Search by team name or number** filters the library. Clicking a logo inserts it onto the canvas.
- The **Pictures on your button** panel lists uploaded and team art, lets students select a layer, and moves it forward/backward in the stack.
- While dragging images, teal **snap-to-center guides** appear only in the editor. They never print.
- The existing advanced controls, cropping, portable save files, and PDF output remain available.

## Phase 3 — classroom Print Studio

Click **Preview, print & combine buttons** (or **Print Studio** beside Undo/Redo) to open a dedicated printing workspace. The editor stays unchanged while printing.

- **My button**: Select cut-circle diameter and quantity (including 6 or 9 buttons), inspect the matching sheet preview, and download an actual-size US Letter PDF. Non-blocking design warnings flag oversized images, curved text shrinking below 7 pt or approaching the ring, text/background contrast below WCAG 4.5:1, and missing paper wrap. Patterns may need additional human contrast checks. Warnings are guidance, not guaranteed collision detection.
- **Classroom sheet**: Add your current design, import multiple student `.json` editable project files or finished `.png` designs, set each button's quantity, reorder the print queue, preview every page, and download one combined PDF. The total is capped at 120 buttons or 30 designs per batch. PNG artwork is flattened, and the whole classroom sheet uses one selected finished size; **JSON projects are preferred** so the editor can rescale each design consistently.
- **Local autosave and recovery**: The app stores a small automatic backup on the same browser/device. Students can restore a previous design when they reopen the site. If browser storage is full, students should use **Download editable project** instead.
- **Print safety**: All PDFs use US Letter page geometry and the cut-circle size selected. Print at **Actual size / 100%**, check the press manufacturer's exact paper diameter, and measure a test sheet. A successful PDF download is not proof of physical printer calibration.
- **Privacy**: All mixed-sheet imports and artwork rendering happen in the browser. Imported student projects are not sent to a server by this application.

## Shared GitHub button design library

Approved designs stored in the public [`designs/` folder](https://github.com/aspiece/button-designer/tree/main/designs) are available in the **Saved team designs** gallery. Students can search and:

- **Open & edit** a saved `.json` project. Editable layers, text, logo positions, and color settings are restored, without changing the original repository file.
- **Use PNG on canvas** to insert a finished flattened button image. PNGs do not retain independently editable lettering.
- **Add to print sheet** to send a library design directly to the teacher's Classroom Print Studio queue.

Three reusable examples are included: Fenton Paw Classic, Titanium Tigers Badge, and Fenton Orange Team Spirit. To contribute another approved design, use **Save a new design for future projects** in the library panel. This downloads an editable `.json` with the design name and notes. A repository maintainer reviews it, then uploads it to `designs/` and commits the files. The **Publish approved button designs** GitHub Action validates uploaded projects, updates `designs/catalog.json` and requests a new Pages build. No student GitHub authentication, backend database, or paid service is required.

**Privacy:** The repository and its shared assets are public. Do not upload student names, photographs, or other identifying details without the school's approval. Saving a project in the student browser is local; clicking Download does **not** publish it to the repo. See [the designs folder instructions](designs/README.md).

## Kid-friendly public-use artwork (teacher-approved)

The Fenton **Logos → Image Library** has **one search field, one Category filter, and one set of image cards**. Choose **Public Images** beside Robotics Teams, FIRST Logos, or School Logos. Public Images contains **18 original CC0 starter illustrations** tagged with robotics, science, nature, sports, school, and seasonal keywords. Search works across all images. Each of the 18 transparent starter illustrations has an **Artwork color** dropdown: **Original, Black, Orange, or White**, matching the robotics team logo workflow. The selected thumbnail preview shows the chosen tint, and that same version is inserted as a movable/resizable PNG layer and printed in PDFs. White/orange thumbnails use a dark preview surface for visibility. Recoloring affects the artwork's visible shapes only and retains its transparent background. Other public images default to original colors unless specifically reviewed and marked recolorable.

**Child safety:** There is no live Openverse/external search. The **Public Images** category only contains same-origin files explicitly marked `approved: true` in [`approved-art/catalog.json`](approved-art/catalog.json), with CC0/PDM license and source metadata. Unlisted files never appear in the student gallery. Existing team/FIRST logo treatment and the upload control are unchanged. Images uploaded directly from student devices are **not** screened by this catalog.

For vetted public-domain/CC0 images from **Openverse** or another external source, adults should verify the original source's license, inspect the entire image, and commit it with accurate creator/source metadata after review. Instructions: [approved-art review and publishing guide](approved-art/README.md). Unlike the team-logo gallery, the approved-art catalog is never automatically populated by file discovery. `python3 scripts/validate_approved_art.py` and GitHub CI check asset and metadata policy; they cannot replace an educator's visual/license review.

## Automatically updated Fenton image gallery

The Fenton edition combines the automatically generated `logos/catalog.json` and separately teacher-reviewed `approved-art/catalog.json` in the same **Image Library**, with categories **School Logos**, **Robotics Teams**, **FIRST Logos**, and **Public Images**. Existing team-logo entries remain available; public image entries must be explicitly approved. Selecting a thumbnail adds an editable layer that can be moved, resized, cropped, and printed.

**To add permanent images:** A teacher/maintainer opens [the Fenton logos folder](logos/README.md), chooses the appropriate category folder, uploads the approved PNG/JPEG/WebP/AVIF files through GitHub, and commits. The [automatic gallery publishing workflow](.github/workflows/publish-image-gallery.yml) rebuilds `logos/catalog.json` and republishes the updated GitHub Pages site. New uploads require no app-code edits.

The general-purpose edition at `/studio/` neither loads the approved-image catalog nor preloads any Fenton artwork; students can still upload their own local images there.

## Three-column laptop editor

On laptops and desktops (1120px or wider), the Fenton Button Designer now uses **Create (left) → Preview (center) → Properties & Layers (right)**. The right panel reuses the existing context-sensitive editor for selected text, images, and background; it also includes selectable text/background layers, the existing reorderable image list, and live design warnings. **Save & Export and Print Studio now live exclusively inside the Print tab**, with the original functional controls moved rather than duplicated. Selecting **Logos** goes straight to the searchable Image Library, including on small screens where the page scrolls directly to the gallery. Switching to **Print** reveals the print action first, followed by a collapsible Save & Export group and the existing production controls. Printed sizes and design data stay unchanged. On tablets and phones (under 1120px), two compact **Edit Selected** and **Layers** buttons sit beneath the preview; the full panel stays closed until requested. Phones open a bottom sheet and tablets a side drawer with the same real selection controls and layer list, a backdrop and Close/Escape dismissal. Selecting a layer opens its editing controls; the panel also closes when students switch tabs. Keyboard focus is managed within the open drawer. The desktop three-column editor remains unchanged. The General Edition remains unchanged.

## Student workflow

1. Open the designer and select a starting template.
2. Customize curved text, colors and borders; optionally add center text.
3. Select a Fenton team logo or upload/drag an image, then adjust its size and position.
4. **Download editable project** if you want to return to the design later. Browser storage can be cleared or fill up.
5. Select the paper cut-circle diameter required by your actual button press, choose the number of buttons, then **Download print-ready PDF**.
6. Print at **100% / Actual size**, not Fit to page, and **measure a test cut circle with a ruler** before production.

## Print preview and actual dimensions

The selected button quantity determines what appears in both the preview and PDF. The 6-button default uses a centered **2-column × 3-row** grid on US Letter paper, rather than leaving a blank bottom row in a 3×3 grid. Nine identical buttons use the full 3×3 grid at the standard 2.625-inch cut diameter. Every PDF page is **612 × 792 points (8.5 × 11 inches)**; always print at 100% and measure a physical test circle.

## Button sizes and print dimensions

**2.25 inches is the default finished button size.** It uses a manufacturer-reference **2.625-inch paper cut circle** and **2.063-inch safe artwork diameter**. The app offers every common round size below. Choose a finished diameter in the beginner editor or Print Studio; it updates the design face, cut line, artwork position, PDF filename, and letter-sheet grid.

| Finished diameter | Initial paper cut diameter | Safe artwork diameter | Buttons per US Letter sheet |
|---|---:|---:|---:|
| 1" | 1.313" | 0.875" | 35 |
| 1.25" | 1.629" | 1.156" | 24 |
| 1.5" | 1.837" | 1.375" | 20 |
| 1.75" | 2.088" | 1.593" | 12 |
| **2.25" (default)** | **2.625"** | **2.063"** | **9** |
| 2.5" | 2.8" | 2.2" | 6 |
| 3" | 3.451" | 2.875" | 6 |
| 3.5" | 4.0" | 3.312" | 4 |
| 4" | 4.5" | 3.75" | 2 |
| 6" | 6.656" | 5.812" | 1 |

**Do not assume every press uses these exact cut sizes.** Dimensions from American Button Machines and Tecre provide reference values for 1", 1.25", 1.5", 1.75", 2.25", 3", 3.5", and 6"; the 2.5" and 4" cut sizes are supplier-dependent examples. A 58 mm imported machine may not accept American Standard 2.25" tooling.

You can adjust the paper cut diameter independently after choosing the finished size. The grid uses the chosen cut diameter and includes gap/margin allowances for cutting, but each printer has different unprintable margins. Print at **Actual size / 100%**, measure one paper cut circle with a ruler, and make one physical button before production. Older saved projects without an explicit size continue using their original **2.5-inch finished size**.

References: [ABM print sizing guide](https://nlc.nebraska.gov/grants/InnovationStudios/Documents/buttonmaker_instructions.pdf), [ABM standard sizes](https://www.americanbuttonmachines.com/pages/how-to-choose-a-button-size), [Tecre 6-inch cutter](https://www.tecre.com/sft629/600-button-maker-machine-layout.pdf).

## School deployment

This is a static site published from the `main` branch root through GitHub Pages (repository **aspiece/button-designer**). To deploy changes: Settings → Pages → Deploy from branch → `main` → `/ (root)`.

Logo assets are stored within the same public repository. Do not put photos of students or private information in this public GitHub repo. Student-provided images and editable designs remain on the student's device unless they manually export/share them. Imported file contents are not sent to a server by the app.

## FIRST branding

FIRST LEGO League, FIRST Tech Challenge, and FIRST Robotics Competition marks should be obtained from FIRST's official brand resources and used according to its guidelines: https://www.firstinspires.org/brand/logos-guidelines

## Release checklist

Test in Chrome/Edge on school-managed computers, including logo loading, mobile/pointer drag, image cropping, save/reopen, and PDF printing at Actual size. Verify a physical cut circle against the button press's paper specifications. JavaScript parsing and code-level checks **do not replace** an end-to-end browser and physical print test.

## Licensing

No license has been selected. Fenton/team logos are not licensed for unrelated redistribution by this repository.

## Install on a phone or computer

Both editions are installable web apps (PWAs), served from GitHub Pages without an app store or account. Open the Fenton edition or General Edition, then select **Install app** in the header. Chrome and Edge can display a native installation dialog when supported. Safari on iPhone/iPad uses **Share → Add to Home Screen**; Safari on macOS uses **File → Add to Dock**. The site provides these instructions when the browser cannot show a prompt.

The installed app launches without browser tabs and saves browser-local designs on that device. An offline service worker caches the editor shell and previously fetched resources, but previously unseen gallery images may require internet. Installing does not sync designs across devices or change GitHub Pages hosting.
