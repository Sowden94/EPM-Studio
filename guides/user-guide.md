# EPM Studio user guide

## Draw a molecule

This beta uses drawing-only molecule input. Image upload, paste and recognition are not available.

Use a bond tool to click two positions or drag a bond. Continue from an existing vertex to extend a chain. Use C/N/O/H or Other atoms to replace a vertex with an element. Additional tools provide formal charges, Fit, Tidy and Clear. Move repositions atoms; Eraser removes atoms or bonds. Undo and Redo recover edits.

Draw one connected molecule for a browser estimate. A disconnected mixture, invalid valence or unsupported environment can fail. Choose Show potential map after checking the drawing.

## Know which map you are seeing

The method badge distinguishes Browser estimate · Gasteiger, a quantum example method such as RHF/6-31G*, or an imported calculation. A modified drawing hides its old map until a corresponding map is loaded or calculated.

The default Auto mode matches the six available quantum examples first. Other drawings use local estimates. Settings → Map calculation can force browser estimates for every drawing. Browser maps use a van der Waals envelope; the density isovalue control applies to quantum-derived and imported density maps.

## Adjust appearance

Drag the viewer or use its arrow-key controls to rotate. Plus/minus zoom. Settings contains numerical view controls, potential range, palette and label choices. Carbon and heteroatom labels are shown by default. The Labels checkbox hides all labels; Atom labels chooses all except H, heteroatoms only, or all atoms.

The Map checkbox hides the potential surface. Opacity changes only appearance, not potential values. On the rainbow palette red is negative, green is zero and blue is positive. The scale is in atomic units (hartree/e). Values outside the chosen scale are clipped to its end colours.

## Save a figure or movie

Save image downloads a native 3840 × 2160 PNG. Save animation offers a 1280 × 720 looping GIF at 20 fps, or a WebM movie at 30 fps with Full HD (1920 × 1080), QHD (2560 × 1440) and 4K (3840 × 2160) resolution options. Movie export requires a browser with a supported WebCodecs VP8/VP9 encoder. Rendering can take longer than playback duration. Both formats offer 4/8/12-second full turns. GIF has at most 256 colours; use PNG or WebM for smoother full-colour gradients. The molecule rotates once about the viewer's vertical rotation direction. These are rotations of a fixed model, not molecular dynamics. Export fits the complete surface at the chosen tilt and limits zoom to avoid cropping. Method and potential-scale captions are included.

Captions identify estimates and calculation methods. JSON calculation records and MOL structure downloads are available under Files & calculation details. The app does not maintain cloud project backups.

## Import quantum data

Select a density cube and a matching potential cube from the same calculation. Their grids and atom coordinates must be identical. Density units must be electrons/bohr³ and potential units hartree/e. Maximum file size is 10 MB per cube. Imported provenance is unverified; compare against the source calculation.

See [methods and limitations](methods.md), [hosting setup](../SETUP.md) and [the main feature page](../README.md).
