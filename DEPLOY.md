# Deploying and installing

The app is a static site deployed to **GitHub Pages** by GitHub Actions. The same Actions runner also builds the weekly Market Pulse edition, so no other hosting is needed.

## 1. One-time GitHub setup

1. Push this repository to GitHub (the default branch must be `main`).
2. In the repository go to **Settings → Pages** and under *Build and deployment* set **Source = GitHub Actions**.
3. (Only if your organisation restricts it) **Settings → Actions → General → Workflow permissions** → *Read and write permissions*. The weekly job commits the new edition back to `main`.
4. Push to `main` (or open **Actions → Deploy to GitHub Pages → Run workflow**). After a minute the site is live at

   ```
   https://<your-username>.github.io/<repo-name>/
   ```

   The build sets the base path to `/<repo-name>/` automatically. If you later use a custom domain, set `BASE_PATH=/` in `.github/workflows/deploy.yml`.

5. Trigger the first Market Pulse edition: **Actions → Weekly Market Pulse → Run workflow**. The job fetches the feeds, commits `public/news/…`, and redeploys. From then on it runs every Monday at 06:00 UTC.

## 2. Verifying the news feeds

Before relying on the digest, run locally:

```bash
npm run verify-feeds          # report in docs/feed-verification.md
npm run verify-feeds -- --apply   # also disables failing feeds in config/news-sources.json
```

The job itself tolerates failing feeds (they are skipped and listed in the edition footer), but keeping the config clean avoids noise.

## 3. Install the app

### iPhone (Safari)
1. Open the site URL in **Safari** (other iOS browsers cannot install web apps).
2. Tap the **Share** button (square with an upward arrow).
3. Tap **Add to Home Screen**, then **Add**.
4. Launch it from the Home Screen: it opens full-screen, with the bottom tab bar, and works offline after the first load.

### iPad (Safari)
1. Open the URL in Safari.
2. Tap the **Share** icon in the toolbar → **Add to Home Screen** → **Add**.
3. With a hardware keyboard, press `?` inside the app for the shortcut cheat sheet. The sidebar collapses behind the ☰ button in portrait and landscape.

### Mac — Safari (macOS Sonoma or later)
1. Open the URL in Safari.
2. Menu bar **File → Add to Dock…** (or click the Share button → *Add to Dock*).
3. Click **Add**. The app appears in the Dock and Launchpad and opens in its own window with the persistent sidebar.

### Mac — Chrome / Edge / Brave
1. Open the URL.
2. Click the **install icon** at the right end of the address bar (a monitor with a down-arrow), or **⋮ → Cast, save and share → Install page as app…**
3. Click **Install**. The app opens in its own window and is listed in Launchpad / `~/Applications/Chrome Apps`.

### Any desktop browser, no install
Just use the URL — the layout, keyboard shortcuts and offline cache work in the browser tab as well.

## 4. Moving your progress between devices

Open **Sync devices** (sidebar → *More*, or Settings → *Open Sync*):

- On the first device: **Download file**, **Share…** (AirDrop / iCloud Drive on iPhone & iPad) or **Copy compact code**.
- On the second device: **Choose file** or paste the code, then **Merge (recommended)**. Merge keeps the most recent review per card and the union of bookmarks and saved deals; **Overwrite** replaces everything on that device.

## 5. Updating the app

Every push to `main` redeploys. Installed copies pick up the new version automatically the next time they are opened online (the service worker updates in the background and activates on the following launch).

## 6. Troubleshooting

- **Blank page after deploy** — check that Pages source is *GitHub Actions* and that the base path matches the repository name (see `BASE_PATH` in `deploy.yml`).
- **Market Pulse shows “No edition available yet”** — the weekly job has not run yet; trigger it manually from the Actions tab.
- **Weekly job fails with “Every feed failed”** — the runner could not reach any feed; the previous edition stays live. Check `docs/feed-verification.md` and the job log.
- **The install option is missing on iPhone** — you must use Safari, not an in-app browser.
- **Reset the welcome guide** — Settings → *Show the welcome guide again*.
