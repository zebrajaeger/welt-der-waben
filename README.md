# Welt der Waben

**English** · [Deutsch](README.de.md)

A small ecosystem on a hexagonal grid: grass grows, herbivores feed and divide, and carnivores follow their prey. Watch energy flow through each encounter, one animated step at a time.

Built with TypeScript, Canvas 2D and Vite. The interface supports 30 languages, selected from browser preferences, with English as the default and fallback. Arabic and Hebrew use right-to-left text; simplified and traditional Chinese have separate catalogs. Translations live in separate [i18next language files](docs/i18n.md), which document the full language package and how to add translations.

**Play online:** [Open Welt der Waben](https://zebrajaeger.github.io/welt-der-waben/). Hosted on GitHub Pages and updated automatically after successful checks on `main`. See the [deployment guide](docs/deployment.md) for details.

[Overview](#overview) · [Screenshots](#screenshots) · [Quick start](#quick-start) · [Controls](#controls) · [Simulation rules](#simulation-rules) · [Settings and units](#settings-and-units) · [Development](#development)

## Overview

- **Independent residents:** movement, feeding and division run asynchronously on a clock of 60 ticks per simulation second.
- **Visible energy transfer:** residents reach into the next cell, absorb food while holding contact, then complete their step. More transferred energy takes more time.
- **Animated division:** a resident splits into two halves with equal energy. Each half follows its own path when space is available.
- **Editable settings:** adjust 24 parameters, save them locally in your browser, or return to the defaults.
- **Responsive field:** the whole grid fits the available window area without distortion, including while paused.

## Screenshots

The shared screenshots show the German interface.

![The hexagonal ecosystem with green grass, yellow herbivores and red carnivores](docs/images/simulation.png)

*The simulation paused during a run. Symbol fullness shows energy; extended tips show local actions.*

![The open settings panel with simulation parameters and buttons for applying, saving and restoring defaults](docs/images/settings.png)

*The settings panel scrolled to its actions. Its content scrolls independently of the field.*

## Quick start

Requires **Node.js 22.12 or newer** and npm.

```sh
git clone https://github.com/zebrajaeger/welt-der-waben.git
cd welt-der-waben
npm install
npm run dev
```

Open the address printed by Vite. If you already have the repository, run the last two commands from its root directory.

## Controls

Use the **globe button at the top right** to select a language. Flags and each language's own name make the options recognizable in any interface language. Your choice takes effect immediately, is saved in this browser and overrides browser language preferences on later visits. Switching preserves the current simulation, chart and settings draft; if storage is blocked, the choice still works for this visit. Playback controls remain right-aligned beside the heading, leaving space for the language button.

The table uses English interface labels. Other supported languages display their translated equivalents. The language list scrolls internally; Home/End and arrow keys reveal each focused choice.

| Control | What it does |
| --- | --- |
| **Pause / Resume** | Freeze every process or resume from the same point. |
| **Single step** | While paused, advance exactly one tick: 1/60 of a simulation second, even during movement. |
| **Restart** | Start a new random world with the active settings; keep the pause state and current speed. |
| **Speed** | Change playback immediately, from 0.25× to 8×. At 1×, 60 ticks pass per real second; at 2×, 120. |
| **Settings** | Expand or collapse the parameter panel. |
| **History** | Expand or collapse the population and energy history chart. |
| **GitHub icon** | Next to “A small ecosystem”, open the source repository in a new tab. Also accessible with Tab and Enter. |

The status line shows the tick, elapsed simulation time and population of each species. Resizing the window changes only the projection. Different aspect ratios leave some empty space around the centered grid.

The **History** panel records the last 300 simulation seconds, including while closed. Choose any combination of carnivore count, herbivore count, and total energy in carnivores, herbivores or grass. Counts use the left axis; energy uses the right. Both population counts are selected initially.

Hover over the plot to inspect the nearest recorded tick at that horizontal position. The floating tooltip shows its time and all five values, including hidden series. It updates under a stationary pointer while curves scroll, and respects both sweeps on either side of the moving cursor. Empty history areas show no tooltip. Keyboard: focus the chart, use arrow keys or Home/End, and Escape to dismiss.

Numbers follow the selected language (English decimal point, German decimal comma). Current energy and time readouts use two decimal places; counts and ticks remain integers. Fixed number fields keep neighboring labels in place as digits change. Very long values use scientific notation within the same space; hover over the number for its full value, which is also available to screen readers.

The X-axis always shows one decimal place with a fixed alignment. **Details** reveals tick, time range and explanatory text; these stay collapsed initially to leave more room for the simulation.

**Display** switches between **Scrolling curves** (the current time stays on the right while curves move left; the default) and **Sweeping cursor** (the cursor sweeps right, returns to the left and overwrites older curves). The previous sweep remains dimmed to the right of the cursor, with its own simulation time labels. **Time span** selects 10, 30, 60, 120 or 300 simulation seconds per chart width, defaulting to 60. A shorter span means faster horizontal movement without changing simulation speed.

Pause freezes the history and cursor; single step adds exactly one tick. Restart or applying settings clears the history while retaining chart choices. Saving or importing settings into the draft does not clear it. Reload begins a new history with the chart defaults; history and chart choices are not saved or included in settings JSON.

## Simulation rules

| Resident | Appearance | Behavior |
| --- | --- | --- |
| Grass | Green circles or ovals | Grows in small increments in every cell, up to its maximum. |
| Herbivore | Yellow three-pointed star | Chooses an available neighboring cell with the most grass, without avoiding carnivores. |
| Carnivore | Red three-pointed star | Claims at most one reachable herbivore per hunt. |

A low-energy animal appears as three thin arms; as its energy rises, the star fills into a triangle.

### Feeding and movement

The nearest tip first reaches the target cell's center. All tips hold their pose during feeding; the other two tips then follow in sequence. The leading tip moves to its final position as the step finishes. A hunter times contact to its prey's arrival.

Grass and prey energy transfer at a constant rate, so longer meals take longer. Only usable food is removed: excess grass remains, and a partly drained herbivore can survive. The hunter withdraws if the prey survives and enters its cell only when the prey is fully consumed. Other residents and grass growth continue throughout the meal.

### Energy and division

Both species consume energy every tick, including while waiting, moving, feeding or dividing. An animal dies when its energy is exhausted. A trapped herbivore cannot live indefinitely on regrowing grass.

Above its division threshold, a resident can split if at least one neighboring cell is free. Its remaining energy is divided equally. With two free neighbors, both halves move out in different directions; with only one, one half stays. Moving herbivore halves feed in their destination cells. Each half completes its own movement and waiting period before acting again.

Populations may become extinct. **Restart** begins another random run.

## Settings and units

Form edits are a **draft** until explicitly applied. The panel reports whether the displayed values are active or saved.

| Action | Effect |
| --- | --- |
| **Apply & restart** | Validate the draft and start a new world at tick zero. A paused simulation stays paused. Does not save the draft. |
| **Save in browser** | Save the valid draft for later visits. Does not change or restart the current world. |
| **Defaults** | Restore the current program defaults in the form. Then apply them to start a run, or save them for later visits. |
| **Export as JSON** | Download the complete valid form draft as a JSON file, without applying or saving it. |
| **Import JSON** | Choose a local JSON settings file and load it into the form. Apply it to start a new run, or save it for later visits. |

The top **Speed** selector works immediately and also updates the draft's speed field, preserving other edits. Changing **Initial speed (×)** inside the form takes effect only when applied. Neither action saves automatically. **Restart** uses active values and preserves unapplied form edits.

### Parameters

Defaults live in [src/config.ts](src/config.ts). All rates use **simulation time**; one simulation second is always 60 ticks.

| Group | Parameters and defaults |
| --- | --- |
| Field | `width` × `height`: 30 × 20 cells, with fixed boundaries. |
| Grass | `grassMax`: 5; `grassGrowthPerSecond`: 0.25 per cell; `grassEfficiency`: 1. |
| Predation | `preyEfficiency`: 0.5; `energyTransferPerSecond`: 8 gross energy per second. |
| Playback | `speedMultiplier`: 2; changes real-time playback, not the rates per simulation second. |
| Each species | `initialCount`: 10; `initialEnergy`: 10; `maxEnergy`: 20; `divisionFraction`: 0.75. |
| Energy consumption | `energyDrainPerSecond`: 2 for herbivores, 0.33 for carnivores. |
| Action durations | `approachTicks`: 12; `followTicks`: 6 per tip; `waitTicks`: 12; `swellTicks`: 6; `divisionApproachTicks`: 8; `divisionFollowTicks`: 4 per tip. |

Start energy is set independently for each species. It must be greater than zero and no larger than that species' maximum. Changing the maximum does not automatically change start energy. Grass starts at half its maximum, except under initial herbivores, where it starts at zero.

Growth and consumption are spread across ticks. At a transfer rate of 8, transferring 4 energy takes 30 ticks and 8 takes 60 ticks. Efficiencies determine how much food is removed. A meal's budget is fixed at contact; energy consumption does not keep extending it.

Invalid configurations are rejected with an explanation. Initial populations must fit the field, action durations must be positive whole ticks, and division fractions must lie strictly between 0 and 1. Grass growth multiplied by grass efficiency must be lower than herbivore consumption per simulation second.

### Browser storage

Only settings are saved in `localStorage`, not animals or tick counts. Storage belongs to the current browser and address, including protocol and port. Clearing browser data removes it. Reloading starts a fresh world with saved settings, or the program defaults if no valid settings can be loaded.

Invalid or blocked storage produces a notice; editing and applying settings remain usable. Older saved configurations without start energy retain their values and use the former half-maximum start energy for each species.

### JSON settings files

Settings JSON and browser storage records are language-independent; files can be transferred between English and German sessions without conversion.

Use **Export as JSON** in the settings panel to download `welt-der-waben-settings.json`. The file contains the form draft, including start energy and start speed, even if you have not applied or saved it yet. Invalid drafts produce an explanation instead of a download. Files contain settings only; they do not restore animals, grass, tick counts or the same random world.

To transfer settings, open **Import JSON** and select the downloaded file in another browser, on another device, or at another address. Import replaces the entire form draft after validation. It keeps the current world, pause state, active speed and saved settings. Choose **Apply & restart** to activate it, and **Save in browser** to keep it after reloading. These are separate actions.

Cancelling or importing an unreadable, invalid or incompatible file leaves existing values intact and reports errors where needed. File operations stay on your device and work even when browser storage is blocked. Version 1 files are migrated using half of each species' maximum as its start energy. Version 2 requires all parameters; unsupported versions are rejected. Unknown extra fields are ignored and omitted from subsequent exports.

This complete example uses the current defaults. Keep the version and all parameter names; JSON numbers use a decimal point:

```json
{
  "version": 2,
  "config": {
    "width": 30,
    "height": 20,
    "grassMax": 5,
    "grassGrowthPerSecond": 0.25,
    "grassEfficiency": 1,
    "preyEfficiency": 0.5,
    "energyTransferPerSecond": 8,
    "speedMultiplier": 2,
    "approachTicks": 12,
    "followTicks": 6,
    "waitTicks": 12,
    "swellTicks": 6,
    "divisionApproachTicks": 8,
    "divisionFollowTicks": 4,
    "herbivore": {
      "initialCount": 10,
      "initialEnergy": 10,
      "maxEnergy": 20,
      "energyDrainPerSecond": 2,
      "divisionFraction": 0.75
    },
    "carnivore": {
      "initialCount": 10,
      "initialEnergy": 10,
      "maxEnergy": 20,
      "energyDrainPerSecond": 0.33,
      "divisionFraction": 0.75
    }
  }
}
```

## Development

Run `node scripts/check-history-layout.mjs` for a deterministic browser check of number-field positions across digit changes. It starts its own local Vite server and uses the installed Playwright Chromium browser.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite with automatic browser updates when source files change. |
| `npm test` | Check simulation rules, geometry, settings and playback, including long runs. |
| `npm run build` | Check TypeScript and create a production bundle in `dist/`. |
| `npm run preview` | Preview the built site locally under `/welt-der-waben/`. |
| `npm run test:production` | Test the existing production build in Chromium; see the setup below. |

Further reading:

- [Animation, tick order and browser checks](docs/animation.md) — technical notes in German.
- [Updating the README screenshots](docs/screenshots.md).
- [GitHub Pages setup and production browser checks](docs/deployment.md).
- [Local slow-motion examples](scripts/grass-division-demo.html) — with Vite running, open `/scripts/grass-division-demo.html` under its local address. These examples illustrate short and long meals, division and surviving prey.
