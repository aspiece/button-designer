# Fenton Robotics Button Studio

A browser-based 2.5-inch button designer for Fenton Robotics students. [Launch the designer](https://aspiece.github.io/button-designer/).

## Features

- Six editable starting templates: **Fenton Paw**, **Tiger**, **Titanium Tigers**, **Blank**, **Orange**, and **Black**.
- Change background, top/bottom curved text, middle text, fonts, border style and border color (black, white, orange).
- Choose a **custom-drawn** center graphic: none, Fenton F lettermark, tiger paw, or T shield. These drawn graphics are not official logo files.
- Add Fenton team logos from the files already uploaded to `logos/`: Tiger Paws (24471), Tiger Cubs (29168), Tiger Kits (31558), Tiger Claws (31575), Tiger Eyes (31577), Siberian Tigers (38050), Bengal Tigers (52545), Tungsten Tigers, Chromium Tigers, and Iridium Tigers.
- Drag-and-drop multiple PNG/JPEG/WebP/AVIF images onto the button. Select a layer to move, crop, resize, center or remove it.
- Export a button PNG or a **US Letter, actual-size PDF** of repeated button designs.
- Save and restore the design using browser storage, or **download/open an editable JSON project file** to back up work outside the browser.
- No login, paid backend, or account required. Artwork processing is in-browser.

## Interactive editor — Phase 1

The editor now starts with **six picture-based template cards**. Choose a design and tap any text or graphic on the button to edit it. The selection panel shows only the relevant controls:

- **Top and bottom curved text:** change words, adjust size, drag the ring slightly to reposition it, or use the orange handle to resize.
- **Center text:** edit, drag, resize, center, or remove it.
- **Center graphic:** change F, paw, T, or blank; drag or resize it.
- **Uploaded/team images:** tap one to select it, drag to move, drag the orange corner handle to resize, crop, change layer order, or remove it.
- **Background:** change background and border colors.
- **Undo / Redo:** buttons beside the canvas (Ctrl/Cmd+Z, Ctrl/Cmd+Y when not typing in a field). Up to 35 committed design changes are retained during this session.

The **All design settings · advanced** section contains the original precise controls, print settings remain at the right, and PNG/PDF outputs never include the orange selection guides. Editable JSON project files now retain curved-text positions and center-logo placement.

## Phase 2: Find and arrange team logos

- **Beginner / Advanced** buttons keep precise configuration out of the way until students want it.
- A **thumbnail library** shows all ten named Fenton team PNG files already available in `logos/`, grouped by numbered teams and Titanium Tigers teams.
- **Search by team name or number** filters the library. Clicking a logo inserts it onto the canvas.
- The **Pictures on your button** panel lists uploaded and team art, lets students select a layer, and moves it forward/backward in the stack.
- While dragging images and center artwork, teal **snap-to-center guides** appear only in the editor. They never print.
- The existing advanced controls, cropping, portable save files, and PDF output remain available.

## Phase 3 — classroom Print Studio

Click **Preview, print & combine buttons** (or **Print Studio** beside Undo/Redo) to open a dedicated printing workspace. The editor stays unchanged while printing.

- **My button**: Select cut-circle diameter and quantity, inspect the sheet preview, and download an actual-size US Letter PDF. Design warnings flag oversized images, very long arc text, and 2.5-inch circles without paper wrap. Warnings are guidance, not guaranteed collision detection.
- **Classroom sheet**: Add your current design, import multiple student `.json` editable project files or finished `.png` designs, set each button's quantity, reorder the print queue, preview every page, and download one combined PDF. The total is capped at 120 buttons or 30 designs per batch. For PNG imports, the app assumes the PNG already represents the correct cut-circle layout, so **JSON projects are preferred** when mixing cut diameters.
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

## Student workflow

1. Open the designer and select a starting template.
2. Customize text and colors. Choose a border and center graphic.
3. Select a Fenton team logo or upload/drag an image, then adjust its size and position.
4. **Download editable project** if you want to return to the design later. Browser storage can be cleared or fill up.
5. Select the paper cut-circle diameter required by your actual button press, choose the number of buttons, then **Download print-ready PDF**.
6. Print at **100% / Actual size**, not Fit to page, and **measure a test cut circle with a ruler** before production.

## Print dimensions

The finished button face is **2.5 inches**. The cut diameter is typically larger (for wrapping paper around the button) but is press-specific. The app offers 2.75, 2.8, 3.0, and 2.5-inch cutting circles; choose the one specified by your particular machine. A 3.0-inch cut fits six on a letter-sized sheet. The app does not calibrate physical printers automatically.

## School deployment

This is a static site published from the `main` branch root through GitHub Pages (repository **aspiece/button-designer**). To deploy changes: Settings → Pages → Deploy from branch → `main` → `/ (root)`.

Logo assets are stored within the same public repository. Do not put photos of students or private information in this public GitHub repo. Student-provided images and editable designs remain on the student's device unless they manually export/share them. Imported file contents are not sent to a server by the app.

## FIRST branding

FIRST LEGO League, FIRST Tech Challenge, and FIRST Robotics Competition marks should be obtained from FIRST's official brand resources and used according to its guidelines: https://www.firstinspires.org/brand/logos-guidelines

## Release checklist

Test in Chrome/Edge on school-managed computers, including logo loading, mobile/pointer drag, image cropping, save/reopen, and PDF printing at Actual size. Verify a physical cut circle against the button press's paper specifications. JavaScript parsing and code-level checks **do not replace** an end-to-end browser and physical print test.

## Licensing

No license has been selected. Fenton/team logos are not licensed for unrelated redistribution by this repository.
