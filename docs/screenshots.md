# Updating the README screenshots

Both [English](../README.md) and [German](../README.de.md) READMEs share the same PNG files. Capture the real application after a UI change so the images match the documented controls and layout.

## Capture

1. Run `npm install` if needed, then `npm run dev` from the repository root. Open the local address printed by Vite in a fresh browser context with no saved settings.
2. Set the browser's **content viewport to 1280 × 800 CSS pixels**, zoom to 100%, and device scale factor to 1 when using automation. Exclude browser chrome from the captures.
3. Keep the default configuration. Click **Pause**, then **Neustart**. Advance to tick 180 with **Einzelschritt**, or pause a short run at a similarly readable moment with both species present. The current overview was captured at tick 180 with 16 herbivores and 10 carnivores. Different random runs will look different; no particular population is required.
4. With **Einstellungen** collapsed, capture the whole application as `docs/images/simulation.png`. Include the title, controls, status, complete field and legend.
5. Switch to an **800 × 1400 CSS-pixel viewport** for a readable two-column settings view. Open **Einstellungen**, scroll **inside the form** to the bottom, and capture the settings box itself as `docs/images/settings.png`. Include its summary, visible parameters, all three action buttons and the explanatory messages. The limited-height panel intentionally shows only part of the parameter list.

The existing [browser checks](animation.md#browserprüfung) also create current screenshots under `.browser-check/`. They can help select a capture, but only the two curated documentation images belong under `docs/images/`.

## Check before replacing

- View both PNGs at their natural size. Text, colors and controls must remain readable, with no error notices, clipped field edges or personal settings.
- Keep image filenames stable, or update their relative links in **both** READMEs.
- Preview both Markdown files and check the images, captions and language links. Image descriptions and captions are translated; the screenshots retain the actual German UI.
- Keep `.browser-check/` ignored. Do not commit the entire browser-test image collection.
