# EPS-TOPIK Practice

Static EPS-TOPIK practice website prepared for GitHub Pages.

Authentication and Netlify-specific access control have been removed. The exam UI, question data,
timer, result calculation, images, and Korean TTS remain available as a normal public static site.

## GitHub Pages

The included `.github/workflows/static.yml` deploys the repository directly to GitHub Pages.

1. Push the files to the `main` branch.
2. Open **Settings → Pages** in GitHub.
3. Set **Source** to **GitHub Actions**.
4. Open the **Actions** tab and wait for **Deploy static content to Pages** to finish.
5. Open the GitHub Pages URL shown by GitHub.

All site links and script paths are relative, so the project works from a repository subpath such as
`https://USERNAME.github.io/EPS-TEST/`.

## Optional local build

```sh
npm run build
```

This copies the static website to `dist/`. No authentication service or npm dependency is required.
