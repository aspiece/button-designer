# Button Studio — General Edition

**General edition URL:** https://aspiece.github.io/button-designer/studio/

The general edition is a **separate GitHub Pages URL under the existing Fenton Robotics repository**. It is not yet a separate GitHub repository.

## What is different

- Neutral branding and starter templates (Classic, Modern, Badge, Blank, Color Pop, Dark).
- **No preloaded Fenton team images** and no Fenton saved-design catalog.
- User-uploaded artwork only, with no GitHub upload required.
- Separate local browser save and autosave keys from the Fenton editor.
- Shared editor, sizing, layer management, crop tools, PDF exporter and classroom print workflow, maintained from the parent directory.

## Shared engine

The general page at `studio/index.html` loads `../phase1.js`, `../phase2.js`, and `../phase3.js`. Each checks `window.ButtonStudioEdition === 'general'` for presentation and data isolation. Any change to these shared files must be tested in **both** editions. The Fenton-specific `library.js` is not loaded at all in the general edition.

## Future independent repository

The connected GitHub integration can manage files and branches in existing repositories but cannot create a new repository. When a new repository such as `aspiece/button-studio` exists, the general edition can be moved and receive its own GitHub Pages address (`https://aspiece.github.io/button-studio/`). A central shared package or deployment workflow would then keep the editor code in sync.

Do not upload student-identifiable data to a public GitHub repository. In both editions, uploaded artwork is processed locally in the browser unless the user explicitly shares it.
