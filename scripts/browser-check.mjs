import { strict as assert } from 'node:assert';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Pass an existing Playwright module path; no application dependency is needed.
const { chromium } = await import(pathToFileURL(process.argv[2]).href);
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
page.setDefaultTimeout(15000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await mkdir('.browser-check', { recursive: true });
try {
  await page.goto('http://localhost:5173');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const before = await page.locator('#status').innerText();
  await page.waitForTimeout(650);
  assert.equal(await page.locator('#status').innerText(), before);
  await page.getByRole('button', { name: 'Einzelschritt', exact: true }).click();
  const after = await page.locator('#status').innerText();
  assert.equal(Number(after.match(/Schritt (\d+)/)[1]), Number(before.match(/Schritt (\d+)/)[1]) + 1);
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  assert.match(await page.locator('#status').innerText(), /Schritt 0 · 10 Grasfresser · 10 Karnivoren/);
  await page.screenshot({ path: '.browser-check/desktop.png', fullPage: true });
  await page.locator('.energy-key').screenshot({ path: '.browser-check/energy.png' });
  for (const viewport of [{ width: 360, height: 740 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.waitForTimeout(150);
    const bounds = await page.locator('#field').boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= viewport.width);
    assert(bounds.height > 0);
  }
  await page.setViewportSize({ width: 360, height: 740 });
  await page.screenshot({ path: '.browser-check/mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const longRun = await page.evaluate(async () => {
    const { defaultConfig } = await import('/src/config.ts');
    const { initialize, step } = await import('/src/simulation.ts');
    const { render, layout } = await import('/src/render.ts');
    const canvas = document.querySelector('#field');
    const ctx = canvas.getContext('2d');
    let seed = 123;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    let state = initialize(defaultConfig, random);
    let maxFrameMs = 0, totalMs = 0;
    const field = layout(defaultConfig, 1374, 730);
    for (let i = 0; i < 1500; i++) {
      const start = performance.now();
      state = step(state, defaultConfig, random);
      if (new Set(state.animals.map(a => a.row * 30 + a.column)).size !== state.animals.length) throw new Error('Double occupancy');
      render(ctx, state, defaultConfig, field);
      const duration = performance.now() - start;
      maxFrameMs = Math.max(maxFrameMs, duration); totalMs += duration;
      if (i % 50 === 0) await new Promise(requestAnimationFrame);
    }
    return { steps: state.step, meanFrameMs: totalMs / 1500, maxFrameMs };
  });
  console.log(JSON.stringify({ longRun }));
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('#status').textContent.startsWith('Schritt 0 '));
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const stylePath = new URL('../src/style.css', import.meta.url);
  const original = await readFile(stylePath, 'utf8');
  try {
    await writeFile(stylePath, `${original}\nbody { outline: 3px solid rgb(1, 2, 3); }\n`);
    await page.waitForFunction(() => getComputedStyle(document.body).outlineColor === 'rgb(1, 2, 3)');
    console.log('Hot reload: source CSS change visible without manual navigation or reload.');
    await page.waitForTimeout(250);
  } finally {
    await writeFile(stylePath, original);
    await page.waitForFunction(() => getComputedStyle(document.body).outlineColor !== 'rgb(1, 2, 3)');
  }
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: controls, energy legend, resize, 1500 rendered steps, hot reload, no page errors.');
} finally {
  await browser.close();
}
