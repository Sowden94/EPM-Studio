# EPM Studio · Drawing-only beta

## Apply this update

1. Extract EPM-Studio-Drawing-Only-Update.zip and open repository-files.
2. In Sowden94/EPM-Studio on GitHub, choose Add file → Upload files from the repository root.
3. Drag the contents of repository-files into GitHub, preserving folder paths. Do not upload the ZIP or the outer folder.
4. Commit to main and wait for the Pages deployment under Actions.
5. Open https://sowden94.github.io/EPM-Studio/ and hard refresh. Confirm the Beta badge and Draw molecule heading, with no Upload image tab.

This is a small update for your existing complete website. The large map datasets are not included again. Use this update instead of the previous MolVec/CheerpJ beta update.

## GitHub Pages settings

Settings → Pages → Deploy from a branch → main → /docs → Save.

The README includes the live-site link. To display it in the repository's About sidebar too, click the gear beside About and set Website to https://sowden94.github.io/EPM-Studio/.

## Features

Draw molecules in the left panel, then choose Show potential map. New structures use local qualitative estimates; the six matching examples use quantum-derived maps. Carbon labels, rotation and PNG/GIF/WebM exports remain available. Image upload and automatic recognition are removed. No MolVec or CheerpJ runtime is used.

The Files & calculation details section retains local import of paired scientific cube data. This is separate from image-to-molecule input.

Run npm test with Node.js 22 or later for developer checks. Serve docs with an HTTP server for local development. The app retains its GPL-3.0-only licence; existing libraries retain their own notices.
