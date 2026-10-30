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
