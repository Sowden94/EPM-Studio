# Electrostatic Potential Studio · Beta

**[Open the website](https://sowden94.github.io/EPM-Studio/)** · [Methods and limitations](docs/browser-methods.html) · [Licence](LICENSE)

A browser-based organic chemistry teaching tool for drawing molecules and exploring electrostatic potential maps.

> **Beta — under active development.** Browser-generated maps are qualitative Gasteiger point-charge estimates on a van der Waals envelope. The six bundled quantum examples use converged RHF/6-31G* calculations. These are different methods and should be taught as such.

## Features

- Orgo 101-style drawing: common atoms and halogens, single/double/triple bonds, wedge/dash bonds, charges, lasso selection, moving and deleting selected structures, undo/redo and drawing zoom.
- Click a bond to cycle single → double → triple → single.
- Browser estimates for supported structures up to **100 non-hydrogen atoms**, within **400 total atoms** including hydrogen. Chemical, valence and conformer-generation limits still apply.
- **Bond-line**, **Ball and stick**, and **Comparison mode** tabs at the bottom-left of the viewing panel.
- Bond-line drawings with implicit carbons, compact OH/NH₂ labels, clean aromatic rings and optically aligned atom symbols.
- Linked rotation, zoom, pan, opacity and colour scales in comparison mode.
- Matte ball-and-stick rendering, depth fading, optional surface shading and clear atom labels.
- EPM zoom from 40% to 600%, pointer-centred wheel zoom, Pan and Fit.
- **4K PNG**, **1280 × 720 animated GIF**, and **1080p / 1440p / 4K WebM** exports. Movie export requires a browser with supported WebCodecs encoding; use GIF when unavailable.
- Local MOL downloads, calculation records and matched electron-density/electrostatic-potential cube import.
- Keyboard controls, labelled inputs, visible focus and non-colour-only legends. WCAG 2.2 AA is the target; a complete assistive-technology audit is still required.

Image upload and image recognition are removed. Drawings and calculations remain in the browser. No recognition service or analytics is required.

## GitHub Pages

The site is static and lives in **`docs/`**. This small update retains the previously uploaded example-map data; keep the existing data folder. There is no npm build or separate calculation server to run.

In **Settings → Pages**, choose **Deploy from a branch → main → /docs**, then Save. See [UPLOAD-TO-GITHUB.md](UPLOAD-TO-GITHUB.md) for the complete update steps.

The root `index.html` redirects to `docs/` as a fallback if Pages is still serving from the repository root. Existing root JavaScript files are not used by this package.

## Methods and limitations

Browser estimates use OpenChemLib conformer generation, MMFF94 refinement when available and Gasteiger–Marsili atomic charges. They do not compute a quantum wavefunction or electron density. They omit anisotropic charge density, halogen σ-holes, polarisation, solvent and conformational averaging; do not use them alone to infer quantitative interactions or selectivity.

The precomputed examples use PySCF RHF/6-31G*, RDKit ETKDG/MMFF94 geometries, 64³ density grids and direct electrostatic-potential evaluation. They are gas-phase, single-conformer examples without quantum geometry optimisation. The default colour scale is shared across molecules: red negative, green zero and blue positive.

Bond-line and ball-and-stick views display the **same 3D conformer and potential surface**. Bond-line is a skeletal projection, not an independent planar calculation. Comparison and rendering controls do not change computed values.

Read [Methods and limitations](docs/browser-methods.html) for sources and provenance.

## Licence and credits

First-party application code: **GPL-3.0-only**. Copyright © 2026 M. J. Sowden. Third-party components retain their own licences; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) and the licence files under `docs/vendor/`.

This update contains the accepted demo source through version 27, commit `f8b94750a4a55b4dfc8cc84495e1baf58c4daaca`, packaged for GitHub Pages.
