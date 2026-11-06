# Contributing to EPM Studio

Use Issues for bugs and feature suggestions, and Pull requests for proposed changes. These features must be enabled by the repository owner. Never include confidential research structures or personal data in a public report.

## Local checks

With Node.js 22 or later, run `npm test` from the repository root. Runtime libraries are bundled, so no dependency installation is needed for the static site or checks. Serve `docs` with a local HTTP server to test the browser app; opening index.html as a file is not sufficient for module Workers. The image-recognition route needs a server-capable deployment as described in SETUP.md.

## Changes to chemistry or rendering

Include the concrete problem, resulting behaviour and checks performed. For scientific changes, cite the source, preserve units and method labels, and add meaningful reference cases. Changes must not present point-charge estimates as quantum-derived density maps. Preserve seeded geometry, formal charges and stereochemistry, or fail explicitly when unsupported.

Check keyboard controls, visible focus, accessible labels, the software canvas fallback and lecture exports where relevant. WCAG conformance is not assumed from automated checks alone.

## Licensing

Submit contributions under the project's GPL-3.0-only licence. Preserve upstream notices and document any new dependency in THIRD-PARTY-NOTICES.md. Do not add credentials, uploaded research files, node_modules or generated temporary data to a pull request.
