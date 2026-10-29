# Robotics Button Studio

A student-friendly browser designer for creating 2.5-inch robotics pin-back buttons and printing sheets of matching designs.

## Fenton Robotics defaults

The initial design uses Fenton orange (`#F58220`), black (`#111111`), and white. All five templates start in the Fenton palette but students can adjust colors individually. The **Fenton-themed artwork** dropdown contains four original graphics (tiger stripes, gear, F monogram, and 5114 shield). These are not official team logos. To use official assets, upload PNG/SVG files in the image upload control. Uploads stay in the current browser session unless the design is explicitly saved in local storage.

## League logos and image layers

Official FLL, FTC, and FRC logos are available through the linked [FIRST brand downloads](https://www.firstinspires.org/brand/logos-guidelines). They are **not bundled** with this repository yet; select the desired official PNG/SVG and upload it in the designer. Multiple images can be uploaded or dropped onto the circular canvas. Use **Selected image layer** to choose which image to reposition, resize, crop, or remove. Students may change all Fenton theme text, colors, and artwork.

## Features

- Design custom buttons with text, colors, and uploaded images.
- Crop uploaded images before placing them on the design.
- Adjust the paper cut-circle diameter to match your button press.
- Export printable PDF sheets of repeated designs.
- Works as a static site; no student accounts or server required.

## Run locally

Download `index.html` and open it in a modern browser.

## Publish for free with GitHub Pages

1. Create a public repository named `robotics-button-studio`.
2. Upload `index.html` and `README.md` to the repository's root folder.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**, choose `main` and `/ (root)`, then save.
5. GitHub Pages will show your published URL when the deployment finishes, commonly `https://YOUR-USERNAME.github.io/robotics-button-studio/`.

## Printing

Set your cut circle to the template diameter required by **your specific button press**. A finished 2.5-inch button typically needs a larger printed cut circle to wrap around the back. Print PDFs at **Actual size / 100%**, not **Fit to page**, and test one sheet before mass production.

## Student privacy

This app is designed to edit artwork in the browser, without a student database. Do not upload student personal data or photos without school approval. If externally hosted scripts are introduced later, review their privacy and content security implications before classroom use.

## License

No license selected yet. Add a LICENSE file if you want to permit redistribution or modification by others.