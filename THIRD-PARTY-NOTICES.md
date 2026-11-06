# Third-party notices

EPM Studio's original application code is GPL-3.0-only. Third-party files retain their original notices and terms. The complete bundled licence texts below must remain with redistributed copies.

| Component | Purpose | Bundled licence |
|---|---|---|
| Three.js | WebGL molecular rendering | [MIT](docs/vendor/THREE-LICENSE.txt) |
| gifenc | GIF palette quantisation and encoding | [MIT](docs/vendor/GIFENC-LICENSE.txt) |
| OpenChemLib JS 9.25.2 | Molecule handling, conformer generation and MMFF94 refinement | [BSD](docs/vendor/openchemlib/LICENSE) |
| RDKit Gasteiger implementation and parameters | Adapted browser atomic-charge model | [BSD](docs/vendor/RDKit-LICENSE.txt) |

The original RDKit copyright notice is retained in `docs/browser-epm.js`. The browser chemistry libraries are bundled for same-origin delivery; no CDN account is needed.

## Scientific methods and external services

PySCF and RDKit were used to prepare the included quantum examples. They are optional Python dependencies for `calculation-scripts`, not bundled Python executables. NumPy and scikit-image are also listed in that folder's requirements. Installing or redistributing those dependencies is subject to their respective upstream licences; the requirements file does not replace those notices.

DECIMER recognition is called through the public Cheminformatics Microservice API. Its model is not bundled. The external service controls its own availability, processing and terms. Images are sent only when a visitor chooses recognition. EPM Studio is an independent application and no endorsement by dependency or service authors is implied.

Scientific references and interpretation limits are in [guides/methods.md](guides/methods.md).
