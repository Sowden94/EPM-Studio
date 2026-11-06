# Media provenance

These examples were produced from EPM Studio data using its own software-rendering (`render2d`) and export-caption (`frame`) functions, evaluated with a local canvas implementation. They are not screenshots of another application or generated artwork.

- `acetic-acid-quantum.png`: the bundled acetic-acid RHF/6-31G* potential, on the 0.001 e/bohr³ density surface, with 42% opacity and a ±0.050 a.u. scale. The source geometry is RDKit ETKDG/MMFF94, without quantum geometry optimisation.
- `chloromethane-estimate.png`: a local OpenChemLib conformer, MMFF94 refinement and Gasteiger point-charge estimate on a smoothed van der Waals surface. This is not a quantum electron-density map.
- `acetic-acid-rotation.gif`: 48 frames at 12 fps, one complete 360° turn, using the same caption, palette and GIF encoding approach as the application. It rotates a static model rather than simulating motion.

The figures use the default rainbow palette, non-hydrogen atom labels and a 1.25× viewer zoom. They demonstrate rendering features, not comparative validation of the two calculation methods.

The export renderer requests Arial. These bundled media use the compatible Liberation Sans font for local canvas rendering; no font files are bundled.
