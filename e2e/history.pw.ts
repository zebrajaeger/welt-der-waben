import { expect, test, type Page } from '@playwright/test';
import { defaultConfig } from '../src/config';
import { serializeSettings } from '../src/settings-format';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tick = async (page: Page) => Number((await page.locator('#status').innerText()).match(/^Tick (\d+)/)![1]);
const image = (page: Page) => page.locator('#history-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());

test('offers an independent keyboard-accessible panel, choices and current values', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('./');
  await expect.poll(() => tick(page)).toBeGreaterThan(0);
  await button(page, 'Pause').click();
  const before = await tick(page);
  await expect(page.locator('#history')).not.toHaveAttribute('open');
  await page.locator('#history summary').focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Darstellung', { exact: true })).toHaveValue('scroll');
  await expect(page.getByLabel('Zeitspanne', { exact: true })).toHaveValue('60');
  await expect(page.locator('#history-span option')).toHaveText(['10 s', '30 s', '60 s', '120 s', '300 s']);
  const counts = ['Anzahl Karnivoren', 'Anzahl Grasfresser'];
  for (const label of counts) await expect(page.getByRole('checkbox', { name: label, exact: true })).toBeChecked();
  for (const label of ['Energie Karnivoren', 'Energie Grasfresser', 'Energie Gras']) {
    const checkbox = page.getByRole('checkbox', { name: label, exact: true });
    await expect(checkbox).not.toBeChecked();
    await checkbox.focus(); await page.keyboard.press('Space'); await expect(checkbox).toBeChecked();
    expect(await checkbox.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  }
  await expect(page.locator('#history-values > div:visible')).toHaveCount(5);
  await expect(page.locator('#history-time')).toContainText(`Tick ${before} ·`);
  await expect(page.locator('#history-range')).toHaveText(/^Aufgezeichneter Verlauf: 0–/);
  await page.locator('#settings summary').click();
  await expect(page.locator('#history')).toHaveAttribute('open');
  await expect(page.locator('#settings')).toHaveAttribute('open');
  await page.locator('[name="width"]').fill('31');
  await page.locator('#history summary').click(); await page.locator('#history summary').click();
  await expect(page.locator('[name="width"]')).toHaveValue('31');
  for (const checkbox of await page.locator('#history-metrics input').all()) await checkbox.uncheck();
  await expect(page.locator('#history-empty')).toBeVisible();
  await expect(page.locator('#history-values > div:visible')).toHaveCount(0);
  expect(await tick(page)).toBe(before);
  expect(errors).toEqual([]);
});

test('records while closed and preserves playback, choices and history across view-only actions', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-20T12:00:00Z') });
  await page.goto('./');
  await page.clock.pauseAt(new Date('2026-10-20T12:00:01Z'));
  await button(page, 'Pause').click(); await button(page, 'Neustart').click();
  await button(page, 'Weiter').click(); await page.clock.runFor(1500);
  await button(page, 'Pause').click();
  const paused = await tick(page); expect(paused).toBeGreaterThan(100);
  await page.locator('#history summary').click();
  await expect(page.locator('#history-time')).toContainText(`Tick ${paused} ·`);
  await expect(page.locator('#history-range')).toHaveText(/^Aufgezeichneter Verlauf: 0–/);
  const frozen = await image(page);
  await page.clock.runFor(1000); expect(await image(page)).toBe(frozen);
  await button(page, 'Einzelschritt').click();
  await expect(page.locator('#history-time')).toContainText(`Tick ${paused + 1} ·`);
  expect(await tick(page)).toBe(paused + 1);
  await page.getByRole('checkbox', { name: 'Energie Gras', exact: true }).check();
  const withEnergy = await image(page); expect(withEnergy).not.toBe(frozen);
  await page.getByLabel('Darstellung', { exact: true }).selectOption('sweep');
  await expect(page.locator('#history-sweep')).toBeVisible();
  const swept = await image(page); expect(swept).not.toBe(withEnergy);
  await page.getByLabel('Zeitspanne', { exact: true }).selectOption('10');
  expect(await image(page)).not.toBe(swept);
  expect(await tick(page)).toBe(paused + 1);
  await page.getByLabel('Tempo', { exact: true }).selectOption('8');
  expect(await tick(page)).toBe(paused + 1);
  await page.locator('#settings summary').click();
  const range = await page.locator('#history-range').innerText();
  const unchanged = await image(page);
  await button(page, 'Im Browser speichern').click();
  await page.locator('#settings-file').setInputFiles({ name: 'settings.json', mimeType: 'application/json', buffer: Buffer.from(serializeSettings(defaultConfig)) });
  await expect(page.locator('#settings-message')).toContainText('JSON-Einstellungen ins Formular geladen');
  expect(await page.locator('#history-range').innerText()).toBe(range);
  expect(await image(page)).toBe(unchanged);
  await page.locator('[name="width"]').fill('0'); await button(page, 'Übernehmen & neu starten').click();
  expect(await tick(page)).toBe(paused + 1);
  await page.locator('[name="width"]').fill('30');
  await button(page, 'Übernehmen & neu starten').click();
  await expect(page.locator('#history-time')).toHaveText('Tick 0 · 0 s');
  await expect(page.locator('#history-range')).toHaveText('Aufgezeichneter Verlauf: 0–0 s (max. 300 s)');
  await expect(page.getByLabel('Darstellung', { exact: true })).toHaveValue('sweep');
  await expect(page.getByLabel('Zeitspanne', { exact: true })).toHaveValue('10');
  await expect(page.getByRole('checkbox', { name: 'Energie Gras', exact: true })).toBeChecked();
  await button(page, 'Einzelschritt').click(); await button(page, 'Neustart').click();
  await expect(page.locator('#history-time')).toHaveText('Tick 0 · 0 s');
  await expect(button(page, 'Weiter')).toBeVisible();
  await page.reload(); await button(page, 'Pause').click();
  await expect(page.locator('#history')).not.toHaveAttribute('open');
  await page.locator('#history summary').click();
  await expect(page.getByLabel('Darstellung', { exact: true })).toHaveValue('scroll');
  await expect(page.getByLabel('Zeitspanne', { exact: true })).toHaveValue('60');
  await expect(page.getByRole('checkbox', { name: 'Energie Gras', exact: true })).not.toBeChecked();
});

test('fits both panels and redraws paused charts at desktop and small viewport sizes', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-20T12:00:00Z') });
  await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-20T12:00:01Z'));
  await page.clock.runFor(6500); await button(page, 'Pause').click();
  const before = await tick(page);
  await page.locator('#history summary').click();
  for (const checkbox of await page.locator('#history-metrics input').all()) await checkbox.check();
  await page.getByLabel('Zeitspanne', { exact: true }).selectOption('10');
  await page.locator('#settings summary').click();
  await page.locator('[name="width"]').fill('31');
  for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
    await page.setViewportSize({ width, height });
    for (const mode of ['scroll', 'sweep']) {
      await page.getByLabel('Darstellung', { exact: true }).selectOption(mode);
      const canvas = page.locator('#history-canvas');
      await canvas.scrollIntoViewIfNeeded();
      await expect.poll(() => canvas.evaluate((canvas: HTMLCanvasElement) => Math.abs(canvas.width - canvas.clientWidth * devicePixelRatio))).toBeLessThanOrEqual(1);
      const geometry = await page.evaluate(() => {
        const field = document.querySelector('.field-container')!.getBoundingClientRect();
        const canvas = document.querySelector('#field')!.getBoundingClientRect();
        const chart = document.querySelector('#history-canvas')!.getBoundingClientRect();
        return { scrollWidth: document.documentElement.scrollWidth, width: innerWidth,
          height: field.height, fits: canvas.width > 0 && canvas.height > 0 && canvas.left >= field.left && canvas.right <= field.right && canvas.top >= field.top && canvas.bottom <= field.bottom,
          chartWidth: chart.width, chartHeight: chart.height };
      });
      expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
      expect(geometry.height).toBeGreaterThanOrEqual(160); expect(geometry.fits).toBe(true);
      expect(geometry.chartWidth).toBeGreaterThan(100); expect(geometry.chartHeight).toBeGreaterThan(80);
      await page.locator('.history-chart').screenshot({ path: `.browser-check/history-${width}-${height}-${mode}.png` });
      await testInfo.attach(`history-${width}-${height}-${mode}`, { body: await page.locator('.history-chart').screenshot(), contentType: 'image/png' });
      await page.getByLabel('Zeitspanne', { exact: true }).focus(); await expect(page.getByLabel('Zeitspanne', { exact: true })).toBeFocused();
      expect(await tick(page)).toBe(before);
    }
    await page.locator('#history summary').click();
    await page.locator('#history summary').click();
    await expect(page.locator('[name="width"]')).toHaveValue('31');
    await expect(page.locator('#history-time')).toContainText(`Tick ${before} ·`);
  }
  expect(errors).toEqual([]);
});

test('sizes the chart bitmap for a high density display', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  try {
    const page = await context.newPage(); await page.goto(baseURL!);
    await button(page, 'Pause').click(); await page.locator('#history summary').click();
    await expect.poll(() => page.locator('#history-canvas').evaluate((canvas: HTMLCanvasElement) =>
      canvas.width === Math.round(canvas.clientWidth * 2) && canvas.height === Math.round(canvas.clientHeight * 2))).toBe(true);
  } finally { await context.close(); }
});

test('keeps a bounded history after more than 300 simulated seconds at 8×', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const started = Date.now(), errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-20T12:00:00Z') });
  await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-20T12:00:01Z'));
  await button(page, 'Pause').click(); await button(page, 'Neustart').click();
  await page.getByLabel('Tempo', { exact: true }).selectOption('8');
  await page.locator('#history summary').click();
  await page.getByLabel('Zeitspanne', { exact: true }).selectOption('300');
  for (const checkbox of await page.locator('#history-metrics input').all()) await checkbox.check();
  await button(page, 'Weiter').click();
  await page.clock.runFor(39000);
  const before = await tick(page); expect(before).toBeGreaterThan(18000);
  const retained = async () => {
    const text = await page.locator('#history-range').innerText();
    return [...text.matchAll(/([\d.]+(?:,\d+)?)–([\d.]+(?:,\d+)?)/g)][0].slice(1).map(value => Number(value.replaceAll('.', '').replace(',', '.')));
  };
  const [first, last] = await retained();
  expect(last - first).toBeCloseTo(300, 1); expect(first).toBeGreaterThan(0);
  for (const mode of ['sweep', 'scroll']) {
    await page.getByLabel('Darstellung', { exact: true }).selectOption(mode);
    await expect(page.getByLabel('Darstellung', { exact: true })).toHaveValue(mode);
  }
  await page.locator('#history summary').click(); await page.clock.runFor(1000);
  await page.locator('#history summary').click(); await button(page, 'Pause').click();
  const after = await tick(page); expect(after).toBeGreaterThan(before);
  await expect(page.locator('#history-time')).toContainText(`Tick ${after} ·`);
  const finalRange = await retained(); expect(finalRange[1] - finalRange[0]).toBeCloseTo(300, 1);
  expect(errors).toEqual([]);
  await testInfo.attach('long-run', { body: JSON.stringify({ ticks: after, retainedSeconds: finalRange[1] - finalRange[0], range: finalRange,
    wallTimeMs: Date.now() - started, errors }), contentType: 'application/json' });
});
