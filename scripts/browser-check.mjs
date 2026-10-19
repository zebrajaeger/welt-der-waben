import { strict as assert } from 'node:assert';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { checkSpeed } from './check-speed.mjs';
import { checkPredation } from './check-predation.mjs';

// Usage: node scripts/browser-check.mjs <playwright/index.mjs> [chromium.exe] [base URL]
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('.browser-check', { recursive: true });
const status = () => page.locator('#status').innerText();
try {
  await page.goto(process.argv[4] ?? 'http://localhost:5173');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  assert.match(await status(), /Schritt 0 · 10 Grasfresser · 10 Karnivoren/);
  await page.getByRole('button', { name: 'Einzelschritt', exact: true }).click();
  assert.equal(await page.getByRole('button', { name: 'Einzelschritt', exact: true }).isDisabled(), true);
  await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Schritt 1 '));
  assert.equal(await page.getByRole('button', { name: 'Weiter', exact: true }).isVisible(), true);
  await page.waitForTimeout(550);
  assert.match(await status(), /^Schritt 1 /);

  // Pause and resize a real, in-progress application transition.
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.waitForTimeout(120);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const frozen = await page.locator('#field').evaluate(canvas => canvas.toDataURL());
  const frozenStatus = await status();
  await page.waitForTimeout(600);
  assert.equal(await page.locator('#field').evaluate(canvas => canvas.toDataURL()), frozen);
  assert.equal(await status(), frozenStatus);
  await page.screenshot({ path: '.browser-check/desktop.png', fullPage: true });
  for (const viewport of [{ width: 360, height: 740 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(150);
    const bounds = await page.locator('#field').boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
    assert.equal(await status(), frozenStatus);
    if (viewport.width === 360) await page.screenshot({ path: '.browser-check/mobile.png', fullPage: true });
  }
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.waitForTimeout(80);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  await page.waitForTimeout(600);
  assert.match(await status(), /^Schritt 0 /);
  assert.equal(await page.getByRole('button', { name: 'Einzelschritt', exact: true }).isEnabled(), true);
  await page.setViewportSize({ width: 1440, height: 1000 });

  await checkSpeed(page, browser, errors);
  await checkPredation(page);

  // Reproducible rendered intermediate poses, using real geometry and transition data.
  const contactChecks = await page.evaluate(async () => {
    const { defaultConfig } = await import('/src/config.ts');
    const { transition } = await import('/src/simulation.ts');
    const { makeMotion, sampleMotion, planAnimation, sampleAnimation } = await import('/src/animation.ts');
    const { render, layout, drawShape, colors } = await import('/src/render.ts');
    const { hexCenter } = await import('/src/hex.ts');
    const config = { ...defaultConfig, width: 3, height: 1,
      herbivore: { ...defaultConfig.herbivore, initialCount: 0 }, carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
    const resident = (id, column, species) => ({ id, column, row: 0, energy: 5, species, activeFrom: 1 });
    const state = { step: 0, nextId: 100, grass: [0, 9, 0], animals: [resident(1, 0, 'herbivore'), resident(2, 2, 'carnivore')] };
    const plan = planAnimation(transition(state, config, () => 0));
    const host = document.createElement('section'); host.id = 'animation-check';
    host.style.cssText = 'background:#101c1b;padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;';
    document.body.append(host);
    function cell(label, mount = host) {
      const box = document.createElement('div'), title = document.createElement('p'), canvas = document.createElement('canvas');
      title.textContent = label; canvas.width = 420; canvas.height = 160; canvas.style.width = '100%';
      box.append(title, canvas); mount.append(box);
      return canvas.getContext('2d');
    }
    const field = layout(config, 420, 160);
    for (const species of ['herbivore', 'carnivore']) {
      for (const [time, label] of species === 'herbivore'
        ? [[0, 'Ausgangsform'], [0.2, 'Spitze im Zentrum'], [0.275, 'Zweite Spitze zieht'], [0.35, 'Dritte folgt'], [0.425, 'Letztes Nachziehen'], [0.5, 'Endform']]
        : [[0.3, 'Vor Jagd'], [0.5, 'Kontakt'], [0.575, 'Aussaugen'], [0.7375, 'Zweite Spitze zieht'], [0.9, 'Dritte folgt'], [1, 'Endform']]) {
        const ctx = cell(`${species} · ${label} · t=${time}`);
        render(ctx, { ...state, grass: [0, 0, 0], animals: [] }, config, field);
        const motion = species === 'carnivore' ? plan.motions.get(2) : makeMotion(resident(1, 0, species), { column: 1, row: 0 });
        const tips = sampleMotion(motion, time).map(([x, y]) => [6 + x * field.radius, 6 + y * field.radius]);
        drawShape(ctx, tips, 0.5, colors[species]);
      }
    }
    for (const time of [0.3, 0.499, 0.5, 0.575, 0.65, 1]) {
      const ctx = cell(`Jagd · t=${time}`), frame = sampleAnimation(plan, time);
      render(ctx, frame.state, config, field, frame.shapes);
    }
    for (const energy of [0.01, 0.5, 1]) {
      const ctx = cell(`Energie ${energy} · verformte Figur`);
      const motion = makeMotion(resident(1, 0, 'herbivore'), { column: 1, row: 0 });
      const tips = sampleMotion(motion, 0.275).map(([x, y]) => [6 + x * field.radius, 6 + y * field.radius]);
      drawShape(ctx, tips, energy, colors.herbivore);
    }
    const hunter = plan.motions.get(2), at = sampleAnimation(plan, 0.5);
    const contactTip = at.shapes.get(2)[hunter.leading], target = hexCenter({ column: 1, row: 0 });
    const divisionHost = host.cloneNode(false); divisionHost.id = 'division-check'; document.body.append(divisionHost);
    let checkedDivisions = 0;
    for (const species of ['herbivore', 'carnivore']) for (const width of [2, 3]) {
      const cfg = { ...config, width };
      const full = { ...resident(1, species === 'carnivore' && width === 3 ? 1 : 0, species), energy: 19 };
      const recorded = transition({ step: 0, nextId: 100, grass: Array(width).fill(10), animals: [full] }, cfg, () => 0);
      const splitPlan = planAnimation(recorded), division = splitPlan.divisions.get(1);
      if (!division) throw new Error('Missing division');
      const times = species === 'herbivore' ? [0.3, 0.315, 0.33, 0.4, 0.47, 0.5] : [0.8, 0.815, 0.83, 0.9, 0.97, 1];
      for (const time of times) {
        const ctx = cell(`${species} · ${width === 2 ? 'eine freie Zelle' : 'zwei freie Zellen'} · t=${time}`, divisionHost);
        const frame = sampleAnimation(splitPlan, time);
        render(ctx, frame.state, cfg, layout(cfg, 420, 160), frame.shapes);
      }
      const final = sampleAnimation(splitPlan, division.end);
      if (final.state.animals.length !== 2) throw new Error('Invalid split count');
      const half = division.event.parentBefore.energy / 2;
      const parentEnergy = half + (species === 'herbivore' && width === 3 ? 10 : 0);
      const childEnergy = half + (species === 'herbivore' ? 10 : 0);
      if (final.state.animals.find(a => a.id === 1).energy !== parentEnergy || final.state.animals.find(a => a.id === 100).energy !== childEnergy) throw new Error('Invalid arrival feeding');
      if (species === 'herbivore' && final.state.grass.some(grass => grass !== 0)) throw new Error('Uneaten division grass');
      const originalCell = division.event.parentBefore.column;
      if (width === 2 && !final.state.animals.some(a => a.column === originalCell)) throw new Error('Missing stationary half');
      if (width === 3 && final.state.animals.some(a => a.column === originalCell)) throw new Error('Both halves must leave');
      checkedDivisions++;
    }
    return {
      checkedDivisions,
      preyBefore: sampleAnimation(plan, 0.499).state.animals.some(a => a.id === 1),
      preyAt: at.state.animals.some(a => a.id === 1),
      preyAfterTransfer: sampleAnimation(plan, 0.65).shapes.has(1),
      contactDistance: Math.hypot(contactTip[0] - target[0], contactTip[1] - target[1]),
      preyArrived: JSON.stringify(sampleMotion(plan.motions.get(1), 0.5)) === JSON.stringify(plan.motions.get(1).end),
    };
  });
  assert.equal(contactChecks.preyBefore, true); assert.equal(contactChecks.preyAt, true);
  assert.equal(contactChecks.preyAfterTransfer, false);
  assert.equal(contactChecks.checkedDivisions, 4);
  assert.equal(contactChecks.preyArrived, true); assert(contactChecks.contactDistance < 1e-9);
  await page.locator('#animation-check').screenshot({ path: '.browser-check/animation-poses.png' });
  await page.locator('#division-check').screenshot({ path: '.browser-check/division-poses.png' });
  await page.locator('#animation-check').evaluate(host => host.remove());
  await page.locator('#division-check').evaluate(host => host.remove());

  const slow = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  slow.on('pageerror', error => errors.push(error.message));
  await slow.goto(new URL('/scripts/grass-division-demo.html', page.url()).href);
  await slow.getByRole('button', { name: 'Vor Aussaugen', exact: true }).click();
  assert.equal(await slow.locator('[data-case="two"] .grass').innerText(), 'Gras je Zelle: 10 · 0 · 10');
  await slow.screenshot({ path: '.browser-check/grass-before-arrival.png', fullPage: true });
  await slow.locator('#time').fill('415');
  await slow.locator('#time').dispatchEvent('input');
  assert.equal(await slow.locator('[data-case="two"] .grass').innerText(), 'Gras je Zelle: 5 · 0 · 5');
  assert.equal(await slow.locator('[data-case="two"] .energy').innerText(), 'Energie: 14.0 · 14.0');
  await slow.screenshot({ path: '.browser-check/grass-suction-middle.png', fullPage: true });
  await slow.getByRole('button', { name: 'Nach Aussaugen', exact: true }).click();
  assert.equal(await slow.locator('[data-case="two"] .grass').innerText(), 'Gras je Zelle: 0 · 0 · 0');
  assert.equal(await slow.locator('[data-case="two"] .energy').innerText(), 'Energie: 19.0 · 19.0');
  assert.equal(await slow.locator('[data-case="one"] .grass').innerText(), 'Gras je Zelle: 0 · 0');
  assert.equal(await slow.locator('[data-case="one"] .energy').innerText(), 'Energie: 9.0 · 19.0');
  await slow.screenshot({ path: '.browser-check/grass-after-arrival.png', fullPage: true });
  await slow.close();

  const longRun = await page.evaluate(async () => {
    const { defaultConfig } = await import('/src/config.ts');
    const { initialize } = await import('/src/simulation.ts');
    const { Playback } = await import('/src/playback.ts');
    const { render, layout } = await import('/src/render.ts');
    let seed = 123;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const playback = new Playback(initialize(defaultConfig, random), defaultConfig, random);
    const canvas = document.querySelector('#field'), ctx = canvas.getContext('2d');
    const field = layout(defaultConfig, canvas.clientWidth, canvas.clientHeight);
    const offsets = [0, 100, 250, 287.5, 325, 450, 500];
    let totalMs = 0, maxFrameMs = 0, frames = 0, maxPopulation = 0, divisions = 0;
    for (let i = 0; i < 600; i++) {
      const previousNextId = playback.state.nextId;
      for (const offset of offsets) {
        const start = performance.now();
        playback.tick(i * 500 + offset);
        const frame = playback.frame;
        render(ctx, frame.state, defaultConfig, field, frame.shapes);
        const duration = performance.now() - start;
        totalMs += duration; maxFrameMs = Math.max(maxFrameMs, duration); frames++;
      }
      const state = playback.state;
      divisions += Math.max(0, state.nextId - previousNextId);
      if (state.step !== i + 1 || playback.active) throw new Error('Overlapping or incomplete transitions');
      if (playback.frame.state !== state) throw new Error('End image and status disagree');
      if (new Set(state.animals.map(a => a.row * 30 + a.column)).size !== state.animals.length) throw new Error('Double occupancy');
      if (state.animals.some(a => a.energy <= 0 || a.energy > defaultConfig[a.species].maxEnergy)) throw new Error('Invalid energy');
      maxPopulation = Math.max(maxPopulation, state.animals.length);
      if (i % 10 === 0) await new Promise(requestAnimationFrame);
    }
    return { steps: playback.state.step, frames, divisions, maxPopulation, meanFrameMs: totalMs / frames, maxFrameMs };
  });
  console.log(JSON.stringify({ contactChecks, longRun }));
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  const stylePath = new URL('../src/style.css', import.meta.url), original = await readFile(stylePath, 'utf8');
  try {
    await writeFile(stylePath, `${original}\nbody { outline: 3px solid rgb(1, 2, 3); }\n`);
    await page.waitForFunction(() => getComputedStyle(document.body).outlineColor === 'rgb(1, 2, 3)');
    await page.waitForTimeout(250);
  } finally {
    await writeFile(stylePath, original);
    await page.waitForFunction(() => getComputedStyle(document.body).outlineColor !== 'rgb(1, 2, 3)');
  }
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: animated single step, frozen pause, resize, reset, contact timing, intermediate poses, 600 transitions / 4200 frames, hot reload.');
} finally {
  await browser.close();
}
