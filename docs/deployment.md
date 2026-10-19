# GitHub Pages deployment

The simulation is live at **https://zebrajaeger.github.io/welt-der-waben/**. GitHub Pages uses the GitHub Actions publishing source. The [first deployment](https://github.com/zebrajaeger/welt-der-waben/actions/runs/39320672810) completed successfully on 2026-10-19, and the production browser check also passed against the public site, including controls, saved settings after reload and independent visitor defaults.

## Local development and production preview

Use Node.js 22.12 or newer. The deployment workflow uses Node 22.

```sh
npm ci
npm run dev
```

Development explicitly uses the root path `/`, so existing development URLs and hot updates keep working. Production builds and preview use `/welt-der-waben/`, configured in [vite.config.ts](../vite.config.ts).

To inspect the actual production bundle:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open **http://127.0.0.1:4173/welt-der-waben/**. Preview serves `dist/`; it is a local inspection tool, not a public production server. Stop it before running the automated production check, which owns the same port.

## Automated production check

Install the Chromium version belonging to the locked Playwright dependency:

```sh
npx playwright install chromium
npm run build
npm run test:production
```

On Linux CI, use `npx playwright install --with-deps chromium` to install the required system libraries too. The check starts and stops its own preview server and refuses to reuse an unknown process on port 4173.

The browser opens the built site under `/welt-der-waben/`, checks JavaScript/CSS responses and exercises simulation progress, pause, one-tick stepping, restart, speed and applying/saving/reloading settings. It also checks that a second visitor has independent defaults. It does not import source modules or rely on the development server. Failure traces and screenshots are written under ignored `test-results/`.

The `.pw.ts` files in `e2e/` belong only to Playwright; `npm test` continues to run Vitest's simulation and unit tests. Existing development-specific browser checks are described in [animation.md](animation.md#browserprüfung).

## Enable GitHub Pages

Pages is already enabled for [zebrajaeger/welt-der-waben](https://github.com/zebrajaeger/welt-der-waben). To reproduce the setup in another repository, an administrator or another user with the required repository permissions can follow these steps (adjust the repository URL and Vite base accordingly):

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**. Repository/account policies must allow Pages and the official Actions used by the workflow.
3. Push the prepared workflow to `main`, or select **Actions → Publish GitHub Pages → Run workflow** and choose `main`.
4. Wait for both **build** and **deploy** to complete successfully. The `github-pages` environment shows the deployment URL. Any configured environment approval must also be completed.
5. Open **https://zebrajaeger.github.io/welt-der-waben/**, reload it, and check that the field advances, pause and stepping work, and settings persist when saved.

For a new setup, verify both the first successful run and the public address before announcing it as live. Creating the local files alone does not enable Pages. No personal access token, custom domain or `gh-pages` branch is needed for this workflow.

## What the workflow publishes

[pages.yml](../.github/workflows/pages.yml) runs automatically for pushes to `main`, and can also be started manually. Both jobs explicitly require `refs/heads/main`, so choosing another branch manually cannot publish it.

The build job installs the lockfile dependencies with Node 22, runs Vitest, builds the site, installs Chromium and runs the production browser check. Only then does it upload `dist/`. The deploy job depends on successful completion of the build job and publishes that exact artifact. Tests, source files, README images and the internal slow-motion examples are not separately copied into the deployed site.

The build job can only read repository contents. The deploy job receives `pages: write` and `id-token: write` for the built-in GitHub token. Official Actions are pinned to full commit SHAs with version comments. The shared `github-pages` concurrency group cancels superseded workflow runs; deployments are not allowed to run as independent, uncoordinated jobs. Failed tests or builds leave the previous successful site in place.

## Settings and updates

Every visitor runs their own simulation in the browser. Saved settings belong to the origin: settings saved on `localhost` are not transferred to `zebrajaeger.github.io`, and another browser or device has its own settings. Publishing new static files does not intentionally clear existing settings.

After activation, successful pushes to `main` update the public site. A failed run is visible in the repository's Actions tab. Check the failing job before retrying; changing the repository name or moving to a custom domain also requires updating the Vite base and the documented URL together. To roll back, restore a previously working source revision on `main` and let it pass the same workflow.

## References

- [Vite: Deploying a static site](https://vite.dev/guide/static-deploy.html#github-pages)
- [GitHub: Custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Playwright: Managing the test web server](https://playwright.dev/docs/test-webserver)
