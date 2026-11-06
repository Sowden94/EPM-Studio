# EPM Studio — your GitHub edition

This package contains the complete portable website: source JavaScript, styles, browser chemistry engine, six precomputed quantum examples, image-recognition endpoint, tests and optional scientific data-generation scripts. No ChatGPT account or ChatGPT hosting is needed to run this edition.

**Start with START-HERE.html**, which you can open in your browser. You create and own the repository and the hosting project. Nothing has been created or published on your behalf.

## Choose your hosting route

| Feature | GitHub + Cloudflare Pages (recommended) | GitHub Pages alone |
|---|---|---|
| Draw and edit structures | Yes | Yes |
| Generate local qualitative EPM estimates | Yes | Yes |
| View the six quantum-derived examples | Yes | Yes |
| Rotate; save PNG, GIF and supported WebM movies | Yes | Yes |
| Recognise uploaded/pasted structure images automatically | Yes, via the included Pages Function and external DECIMER service | No; the upload panel explains the missing endpoint |
| Import matching density/potential cubes | Yes | Yes |

GitHub stores your code and history in either route. Cloudflare Pages is the website host in the recommended route. It runs only the small image-recognition endpoint; the EPM estimates still run on the visitor's device. GitHub Pages serves static files and cannot execute that endpoint.

## 1. Create your repository

1. Unzip the download. Open the extracted **EPM-Studio-GitHub** folder.
2. Sign in at https://github.com and select **+ → New repository**.
3. Name it **EPM-Studio**. Choose your own visibility. A private repository works with Cloudflare Pages; GitHub Pages availability for private repositories depends on your GitHub plan.
4. Create the repository. Adding a temporary README makes it easier to access **Add file → Upload files**; this package's README will replace it.
5. Select **Add file → Upload files** (or the empty-repository upload link).
6. Drag the **contents** of the extracted folder into the upload area. Include **all files and folders**, including `docs`, `functions`, `server`, `media`, `guides`, `.github`, the licence/policy files and the tests. On a Mac, press Command+Shift+Period in Finder to show the hidden `.github` folder before selecting it.
7. Commit to `main`. Upload the actual folders and files, **not the ZIP** and not an extra enclosing EPM-Studio-GitHub folder.
8. Check the repository root contains `docs` and `functions`. Opening `docs` should show `index.html`, `app.js`, `data` and `vendor`.

The package is below GitHub's 100-file browser-upload limit, and every individual file is below 25 MiB. If your browser still refuses the folder upload, upload the top-level folders separately, preserving their names.

## 2. Recommended: connect Cloudflare Pages to GitHub

1. Sign in to your own Cloudflare account at https://dash.cloudflare.com.
2. Open **Workers & Pages**, choose **Create application**, and select the **Pages / Connect to Git** route. Cloudflare also offers Workers deployments; choose Pages for this package.
3. Connect GitHub and grant access to your **EPM-Studio** repository. Select that repository.
4. Enter these settings:

| Setting | Value |
|---|---|
| Project name | `epm-studio` or another available name |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `exit 0` |
| Build output directory | `docs` |
| Root directory | Leave blank — repository root |
| Environment variables / API keys | None required by this package |

5. Select **Save and Deploy**. Cloudflare supplies the finished `pages.dev` URL. Use the URL shown by Cloudflare rather than guessing its spelling.
6. Keep `functions/api/recognize.js` and `server/recognize.js` at their supplied repository locations. The Functions folder belongs at the repository root, outside `docs`.
7. Open the URL and complete the checks below.

Use the Git connection, not Cloudflare's dashboard ZIP/Direct Upload path: dashboard uploads do not deploy a Functions folder. Ordinary commits to `main` trigger deployments automatically. You can add a custom domain later from the Pages project's custom-domain settings.

**Website visibility:** a private GitHub repository does not make the deployed website private. Treat the resulting URL as public unless you separately configure access protection. This portable edition deliberately contains no ChatGPT sign-in integration.

## Alternative: GitHub Pages only

1. In your GitHub repository open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Choose branch **main** and folder **/docs**, then **Save**.
4. GitHub will show the published URL when deployment finishes. It can take several minutes.
5. The package contains `docs/.nojekyll`. If your upload omitted that hidden file, use **Add file → Create new file**, name it `docs/.nojekyll`, put `Disable Jekyll` inside, and commit it.

The browser drawing/EPM workflow runs on GitHub Pages without a calculation server. Automatic image recognition is unavailable on this route. Its panel now checks for a working endpoint and explains that limitation instead of attempting a broken upload. Moving the same repository to Cloudflare Pages restores that capability without changing the drawing or EPM code.

## 3. Check your deployed website

- Load one computed example. Its method badge should say **RHF/6-31G***.
- In the drawing, create a single C–Cl bond and choose **Show potential map**. It should produce **CH3Cl · estimated EPM**, with a **Browser estimate · Gasteiger** badge.
- Check carbon labels are visible. Settings offers labels excluding H, heteroatoms only, or all atoms.
- Start rotation, pause it, and download a PNG and a short GIF. The estimate caption must be present in each export. WebM availability depends on the browser's MediaRecorder support.
- On Cloudflare Pages, open **Upload image**, choose a clear image of one molecule and select **Recognise molecule**. Review the returned drawing before generating the map.
- On GitHub Pages alone, the upload panel should explain that automatic recognition needs the included endpoint.

Selecting an image stays local until **Recognise molecule** is clicked. That action sends it to DECIMER at `api.naturalproducts.net` for recognition; do not confuse this with local EPM generation. The external provider controls its own availability and processing. No private API key is included or required by the current endpoint.

## GitHub presentation, licence and repository extras

The root README.md is the public feature page, with actual EPM Studio figures and a looping animation. Keep `media` and `guides` at the repository root so its images and links resolve. The full GPL-3.0-only text is in the root LICENSE file, matching Crystal Studio. THIRD-PARTY-NOTICES.md retains dependency licence information. SECURITY.md, CONTRIBUTING.md and CHANGELOG.md provide repository guidance.

Upload the supplied `.github/ISSUE_TEMPLATE` folder to make the bug and feature forms available. If Finder hides `.github`, use Command+Shift+Period. GitHub controls the Code, Issues, Pull requests, Actions, Releases and Security tabs; a README cannot manufacture those features. Enable Issues and private vulnerability reporting in repository settings if you want to use the supplied forms and reporting policy. There is no GitHub Actions workflow or desktop release in this package.

## 4. Make updates under your control

Edit or replace the relevant files in your repository and commit to `main`. GitHub keeps the revision history. In Cloudflare Pages, check the new deployment is marked successful; in GitHub Pages, check **Actions** and **Settings → Pages**. Then reload the website. If it appears unchanged, try a hard refresh or a private browser window and confirm you are opening the new host's URL, not the old ChatGPT demo.

| What you want to change | Main file |
|---|---|
| Panel layout, labels and page text | `docs/index.html` |
| Colours, spacing and sizing | `docs/style.css` |
| Viewer behaviour, controls and exports | `docs/app.js` |
| Local conformer/geometry generation | `docs/browser-engine.js` |
| Charge model and estimated surface | `docs/browser-epm.js` |
| Atom/bond drawing behaviour | `docs/orgo-sketcher.js` |
| Automatic image-recognition handling | `server/recognize.js` |
| Cloudflare endpoint / capability check | `functions/api/recognize.js` |
| Scientific explanation and licences | `docs/browser-methods.html`, `docs/vendor` |

Keep the supplied third-party licences with the files. The original EPM Studio application code is licensed GPL-3.0-only, matching Crystal Studio; see LICENSE and THIRD-PARTY-NOTICES.md. Publicly served JavaScript can be inspected by visitors even when its repository is private.

## Science and current scope

Browser estimates use one OpenChemLib conformer, MMFF94 refinement when supported and Gasteiger point charges on a smoothed van der Waals surface. They are qualitative estimates, not quantum electron-density maps. They omit anisotropic density, halogen sigma-holes, polarisation, solvent and conformational averaging. Current limits: 40 non-hydrogen atoms, 180 atoms after hydrogen addition and 60 seconds per local calculation. Unsupported structures can fail. Existing examples retain their RHF/6-31G* provenance; matching imported cube files are supported separately.

The optional `calculation-scripts` folder contains the original Python generation code. Running it requires its pinned Python dependencies and recreates the six example datasets in `docs/data`; it is not needed to host or use the website. From the repository root, the generation command is `python calculation-scripts/generate.py`.

## Optional developer checks

With Node.js 22 or newer installed, run `npm test` from the repository root. No `npm install` is needed: runtime libraries are already bundled. Checks cover reference partial charges, halogen conformers and signed surfaces, molecular drawing, cube data, image import, portable asset paths and the Pages Functions adapter. Automated and local tests are not proof of deployment in your account; perform the live checks above after setup.

## Official setup references

- GitHub uploads: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Cloudflare Git connection: https://developers.cloudflare.com/pages/get-started/git-integration/
- Cloudflare static HTML settings: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/get-started/

Prepared 6 November 2026. This is an export for you to deploy; your existing demo has not been changed.
