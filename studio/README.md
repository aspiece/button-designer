# Button Studio — General Edition

**General edition:** https://fentonbuttons.geneseelearninglab.com/studio/

The general edition lives under the existing Button Designer GitHub Pages repository, but has its own neutral appearance, design presets, saved-project storage, and user interface. The Fenton edition remains available from the edition switcher.

## What the general edition includes

- The same **Design / Logos / Print** three-tab interface used by the current Fenton editor.
- A responsive **Properties & Layers** panel, with mobile editing drawer, image crop/resize, undo/redo, keyboard accessibility and live print safety checks.
- **14 generic button templates**: Clean White, Soft Gray, Midnight, Ocean Blue, Deep Teal, Violet, Coral, Warm Sunset, Fresh Mint, Golden Hour, Color Block, Diagonal Lines, Geometric Hex, and Radial Burst. Text, text positions, and artwork are retained when switching templates.
- Public-image gallery drawn **only** from the explicitly approved `approved-art/catalog.json`, with search and subject filters. The two Fenton mascot illustrations in that catalog are excluded.
- Personal image uploads remain available and are processed locally. General edition **does not offer preloaded team logos, school logos, or FIRST logos**.
- Editable design JSON, local save/restore, autosave recovery, button PNG download, print-ready PDF export, and mixed-sheet Print Studio.
- Neutral blue interface styling. No login or paid account required.
- No Umami/logo-tracking script is loaded by the general page. Tracking configured for the Fenton edition is not carried over.

## Shared code and safe isolation

The general page at `studio/index.html` uses the shared `../phase1.js`, `../phase2.js`, `../phase3.js`, `../properties.js`, the shared stylesheets, and `studio/general.css`. Shared components detect `window.ButtonStudioEdition === 'general'` to show neutral templates and only public artwork; the Fenton page retains its own templates, curated team/school/FIRST gallery, and design library.

General browser projects use `generalButtonStudioDesign` and `generalButtonStudioAutosaveV3`; Fenton data is separate. Existing general saved files containing text and image layers remain importable. The obsolete built-in letter/paw mark selection from the old general edition is not included in the new editor.

## Future separate repository

The general edition could be moved into its own repository later. For now, keeping both editions in one repository allows shared improvements to the drawing and printing engine without maintaining two separate codebases.

Do not publish student-identifiable data to a public GitHub repository. Uploaded artwork and project JSON remain on the student's device unless they explicitly export/share them.
