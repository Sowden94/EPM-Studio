# Small update for an existing EPM-Studio website

This package contains all current application files, third-party components and notices, but omits the unchanged example-map data. It is about 4.7 MiB after extraction.

1. Unzip **EPM-Studio-Small-Update.zip**.
2. Open your **EPM-Studio** repository on GitHub, on the main branch.
3. Choose **Add file → Upload files**.
4. Upload the extracted **contents**: the `docs` folder and the root files. Do not upload the ZIP file or its outer folder.
5. Commit to main. Existing files with the same paths are replaced.
6. Under **Settings → Pages**, select **Deploy from a branch → main → /docs** and Save.
7. Wait for **pages build and deployment** in Actions, then refresh the website.

**Keep your existing data folder. Do not delete it or the repository.** The new application can find unchanged map data in `docs/data`, root `data`, or `public/data`, covering the previous package layouts.

This is an update, not a complete new installation. If the website reports that example-map data is missing, the original dataset must be restored separately.

If GitHub still refuses the batch, upload the root files first, commit, then upload the contents of `docs` into the repository's existing `docs` folder and commit. Preserve the vendor subfolder.
