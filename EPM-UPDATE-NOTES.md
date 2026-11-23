# EPM Studio — collaborator meeting update

## Install

Extract this ZIP. Upload its `docs` folder into the root of your existing GitHub repository, replacing the matching files. Keep your existing `docs/data` and `docs/vendor` folders. Do not upload the ZIP itself. Commit the changes, wait for GitHub Pages to finish deploying, then hard-refresh the website (Cmd+Shift+R on Mac; Ctrl+Shift+R on Windows).

The ZIP contains ten changed/new website files, these notes, and a small verification script. No build or new dependencies are needed.

## Changes

- **Show hydrogens:** show each implicit H on its own explicit bond in the drawing and flat bond-line map, while retaining bond-line carbon vertices. This changes display only; it does not add atoms to the drawing or alter the calculation.
- **Rotate selection:** use Lasso to select atoms, choose Rotate selection, and drag around the selection centre. Left/Right keys rotate by 15°; Shift uses 5°. Undo/Redo apply. Rotation preserves bond lengths and wedge/dash definitions. A partial selection rotates about its own centre; bonds crossing its boundary may change length, as with moving a partial selection.
- **Free 3D rotation:** uniform screen-axis drag rotation supports tilting in every direction. Hold Ctrl/Command while dragging for five times finer adjustments. Alt-drag rolls; toolbar Roll buttons and Align view presets offer precise positioning. Settings has a sensitivity slider (default 70%). Software rendering uses lower detail during dragging and returns to full detail on release; exports retain full resolution. Directional buttons are in the main toolbar. Shift-drag or Pan moves the view.
- **Flat bond-line projection:** the original drawing stays in its plane, including wedges/dashes. Drag pans it; 3D rotation and animation are disabled for this mode. Comparison mode keeps this pane flat while the 3D pane rotates.
- **Lone pairs and formal charges:** the flat drawing shows Lewis lone pairs and atom formal charges beneath the translucent overlay. Formal atom charges also appear on the 3D map, independently of element-label visibility.
- **Export:** still images include the flat drawing, labels, overlay, scale, and correct method description. Comparison animations keep the left pane stationary.

## Meaning of the flat map

The flat overlay is a **Gasteiger point-charge estimate on planar drawing geometry**. Hydrogens are added for the field calculation; potential is evaluated on the front of a union of van der Waals spheres and projected orthographically into the drawing plane. It is not the original quantum conformer's potential and is not an electron-density calculation. Flattening changes geometry and therefore the potential. The interface and exports identify the flat estimate separately; the 3D pane retains its original quantum or browser calculation.

Lone-pair dots are Lewis bookkeeping from valence, bond order, and formal charge. They are not computed orbital positions. Formal +/− labels identify integer atom charges, independently of the fractional charges used for the potential colours. Cube imports do not provide reliable formal charges and bond orders, so a flat drawing projection is unavailable for these files.

## Verification

Automated checks: charge and valence conservation, implicit hydrogen counts, projection orientation, bond lengths, stereobond preservation, selected/unselected atoms, normalized trackball mapping, finite field pixels, and formal-charge labels.

Browser checks: hydrogen toggle, keyboard and drag rotation of selected atoms, undo, charged molecule calculation, visible charge on the 3D map, flat/comparison views, free drag navigation, and successful 3840 × 2160 PNG export.

The test browser used the software renderer because WebGL is unavailable in that environment. The WebGL path was updated to use the same orientation and projection overlay, but GPU rendering needs a check on your own browser. A full accessibility audit and new movie encoding run were not performed for this update.

Run model checks from the repository root with Node 22 or later: `node tests/interaction-models.mjs`.

Hydrogen correction: formaldehyde displays H–C bonds at 120° to C=O, matching the supplied reference. Expansion is for display only, so hidden hydrogens cannot accidentally change the editable graph. The flat potential envelope uses the same explicit hydrogen positions as its drawing.

Bond contrast: flat EPM and comparison views now reinforce dark bond ink after overlay compositing to prevent the map washing it out. Image and animation exports use the same rendering.

Atom label contrast: flat EPM hydrogen and heteroatom labels are slightly larger, semibold and near black with a narrow white outline. Lone pairs and formal charges are also reinforced above the coloured overlay. This applies to comparison mode and exports.

Charged compounds: potential scale now defaults to Auto, with symmetric limits centred on zero, padded beyond the largest magnitude sampled on the flat projection or present on the 3D surface. Both panes share the same numeric scale. The fixed ±0.025/0.050/0.100 options remain; ±0.250/0.500/1.000 are also available. Colour variation on an anion remains on the negative side of the palette. Scale limits and auto/fixed mode are included in exports and calculation records. Use the same fixed limit when comparing separate molecules. New drawings remain qualitative Gasteiger point-charge estimates, including for ions.

Verified automatic scaling with acetate, methoxide, ammonium and neutral formaldehyde. Acetate was 100% clipped at the old ±0.050 limit; no sampled values clip at its auto ±0.375 limit. Run `node tests/charged-potential-scale.mjs` for the charge, sign and scale checks.


Toolbar layout restored to its previous appearance; charge controls are back in the More menu. Earlier hydrogen, contrast, rotation and automatic-scale changes are retained.
