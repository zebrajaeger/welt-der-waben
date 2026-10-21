import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page, name: string) => page.locator(`[name="${name}"]`);
const stored = (page: Page) => page.evaluate(() => localStorage.getItem('carnivore-sim.settings'));
const draft = (page: Page) => page.locator('#settings-fields input').evaluateAll(inputs => Object.fromEntries(inputs.map(input => [(input as HTMLInputElement).name, (input as HTMLInputElement).value])));

async function openSettings(page: Page) {
  await page.goto('./');
  await button(page, 'Pause').click();
  await page.locator('#settings summary').click();
}

async function downloadSettings(page: Page) {
  const pending = page.waitForEvent('download');
  await button(page, 'Als JSON exportieren').click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('welt-der-waben-settings.json');
  expect(await download.failure()).toBeNull();
  return readFile((await download.path())!, 'utf8');
}

const upload = (page: Page, text: string, name = 'settings.json') => page.locator('#settings-file').setInputFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
const imported = (page: Page) => expect(page.locator('#settings-message')).toHaveText(/JSON-Einstellungen ins Formular geladen/);

test('imports an exported file in another visitor and applies and saves it only on request', async ({ page, browser }) => {
  await openSettings(page);
  await field(page, 'width').fill('12');
  await field(page, 'height').fill('8');
  await field(page, 'herbivore.initialCount').fill('4');
  await field(page, 'carnivore.initialCount').fill('3');
  await field(page, 'herbivore.initialEnergy').fill('7.125');
  await field(page, 'carnivore.initialEnergy').fill('18');
  await field(page, 'speedMultiplier').fill('3.25');
  const text = await downloadSettings(page);
  const exportedDraft = await draft(page);
  const visitor = await browser.newContext({ locale: 'de-DE' });
  try {
    const other = await visitor.newPage();
    await other.goto(page.url());
    await button(other, 'Pause').click();
    await other.locator('#settings summary').click();
    await button(other, 'Im Browser speichern').click();
    const before = await stored(other);
    const status = await other.locator('#status').innerText();
    await upload(other, text);
    await imported(other);
    expect(await draft(other)).toEqual(exportedDraft);
    expect(await stored(other)).toBe(before);
    await expect(other.locator('#status')).toHaveText(status);
    await expect(other.getByLabel('Tempo', { exact: true })).toHaveValue('2');
    await expect(other.locator('#settings-state')).toHaveText(/noch nicht übernommen.*weicht von gespeicherten/);
    await button(other, 'Übernehmen & neu starten').click();
    await expect(other.locator('#status')).toHaveText('Tick 0 · 0,00 s · 4 Grasfresser · 3 Karnivoren');
    await expect(button(other, 'Weiter')).toBeVisible();
    await expect(other.getByLabel('Tempo', { exact: true })).toHaveValue('3.25');
    expect(await stored(other)).toBe(before);
    await button(other, 'Im Browser speichern').click();
    expect(JSON.parse((await stored(other))!)).toEqual(JSON.parse(text));
    await other.reload();
    await button(other, 'Pause').click();
    await other.locator('#settings summary').click();
    expect(await draft(other)).toEqual(exportedDraft);

    const legacy = JSON.parse(text);
    legacy.version = 1;
    legacy.config.herbivore.maxEnergy = 30;
    legacy.config.carnivore.maxEnergy = 46;
    delete legacy.config.herbivore.initialEnergy;
    delete legacy.config.carnivore.initialEnergy;
    await upload(other, JSON.stringify(legacy));
    await imported(other);
    await expect(field(other, 'herbivore.initialEnergy')).toHaveValue('15');
    await expect(field(other, 'carnivore.initialEnergy')).toHaveValue('23');
    const migrated = JSON.parse(await downloadSettings(other));
    expect(migrated).toEqual({ version: 2, config: { ...legacy.config, herbivore: { ...legacy.config.herbivore, initialEnergy: 15 }, carnivore: { ...legacy.config.carnivore, initialEnergy: 23 } } });
  } finally { await visitor.close(); }
});

test('keeps the draft, world and storage on invalid files, read failure or cancellation and allows selecting the same file again', async ({ page }) => {
  await openSettings(page);
  await button(page, 'Im Browser speichern').click();
  const text = await downloadSettings(page);
  const valid = JSON.parse(text);
  await field(page, 'width').fill('19');
  const beforeDraft = await draft(page), beforeStorage = await stored(page);
  const beforeStatus = await page.locator('#status').innerText();
  const invalidFiles = ['{', 'null', '{}', JSON.stringify({ ...valid, version: 3 }), JSON.stringify({ ...valid, config: { ...valid.config, width: '12' } }), JSON.stringify({ ...valid, config: { ...valid.config, herbivore: { ...valid.config.herbivore, initialEnergy: undefined } } }), JSON.stringify({ ...valid, config: { ...valid.config, width: 1, height: 1 } })];
  for (const invalid of invalidFiles) {
    await upload(page, invalid);
    await expect(page.locator('#settings-message')).toHaveAttribute('data-error', 'true');
    expect(await draft(page)).toEqual(beforeDraft);
    expect(await stored(page)).toBe(beforeStorage);
    await expect(page.locator('#status')).toHaveText(beforeStatus);
  }
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () { return this.name === 'unreadable.json' ? Promise.reject(new Error('read denied')) : read.call(this); };
  });
  await upload(page, text, 'unreadable.json');
  await expect(page.locator('#settings-message')).toHaveText(/konnte nicht gelesen werden/);
  expect(await draft(page)).toEqual(beforeDraft);
  await field(page, 'width').fill('');
  await upload(page, '{');
  await expect(page.locator('#settings-message')).toHaveAttribute('data-error', 'true');
  await expect(field(page, 'width')).toHaveValue('');

  const chooser = page.waitForEvent('filechooser');
  await button(page, 'JSON importieren').click();
  await (await chooser).setFiles([]);
  await expect(field(page, 'width')).toHaveValue('');
  await expect(page.locator('#settings-message')).not.toHaveText(/ins Formular geladen/);
  expect(await stored(page)).toBe(beforeStorage);
  await expect(page.locator('#status')).toHaveText(beforeStatus);
  for (let attempt = 0; attempt < 2; attempt++) {
    await field(page, 'width').fill('19');
    await upload(page, text);
    await imported(page);
    await expect(field(page, 'width')).toHaveValue(String(valid.config.width));
    await expect(page.locator('#settings-file')).toHaveValue('');
  }
});

test('ignores file reads superseded by newer edits, actions, imports or panel disposal', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeController = AbortController;
    const controllers: AbortController[] = [];
    window.AbortController = class extends NativeController {
      constructor() { super(); controllers.push(this); }
    };
    Object.assign(window, { abortSettingsPanel: () => controllers.forEach(controller => controller.abort()) });
    const read = File.prototype.text;
    File.prototype.text = function () {
      if (this.name !== 'slow.json') return read.call(this);
      return new Promise<string>((resolve, reject) => {
        Object.assign(window, { finishSettingsRead: () => read.call(this).then(resolve, reject) });
      });
    };
  });
  await openSettings(page);
  const text = await downloadSettings(page);
  const startSlowRead = async () => {
    await upload(page, text, 'slow.json');
    await expect(page.locator('#settings-message')).toHaveText('JSON-Datei wird gelesen …');
  };
  const finishRead = async () => {
    await page.evaluate(async () => { await (window as unknown as { finishSettingsRead: () => Promise<void> }).finishSettingsRead(); });
    await page.waitForTimeout(50);
  };
  for (const action of ['edit', 'defaults', 'save', 'apply', 'tempo', 'export', 'newer import', 'dispose']) {
    await field(page, 'width').fill('19');
    await startSlowRead();
    if (action === 'edit') await field(page, 'width').fill('21');
    if (action === 'defaults') await button(page, 'Standardwerte').click();
    if (action === 'save') await button(page, 'Im Browser speichern').click();
    if (action === 'apply') await button(page, 'Übernehmen & neu starten').click();
    if (action === 'tempo') await page.getByLabel('Tempo', { exact: true }).selectOption('4');
    if (action === 'export') await downloadSettings(page);
    if (action === 'newer import') {
      const newer = JSON.parse(text); newer.config.width = 22;
      await upload(page, JSON.stringify(newer));
      await imported(page);
    }
    if (action === 'dispose') await page.evaluate(() => (window as unknown as { abortSettingsPanel: () => void }).abortSettingsPanel());
    const expected = await draft(page);
    const expectedMessage = await page.locator('#settings-message').innerText();
    await finishRead();
    expect(await draft(page), action).toEqual(expected);
    await expect(page.locator('#settings-message')).toHaveText(expectedMessage);
  }
});

test('transfers files without browser storage and keeps the actions accessible on a narrow screen', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('storage denied'); } }));
  await page.setViewportSize({ width: 360, height: 800 });
  await openSettings(page);
  await expect(page.locator('#settings-notice')).toHaveText(/nicht verfügbar/);
  const network: string[] = [];
  page.on('request', request => { if (!request.url().startsWith('blob:')) network.push(request.url()); });
  const text = await downloadSettings(page);
  const config = JSON.parse(text); config.config.width = 12;
  await upload(page, JSON.stringify(config));
  await imported(page);
  await expect(field(page, 'width')).toHaveValue('12');
  await button(page, 'Übernehmen & neu starten').click();
  await expect(page.locator('#status')).toHaveText('Tick 0 · 0,00 s · 10 Grasfresser · 10 Karnivoren');
  await button(page, 'Im Browser speichern').click();
  await expect(page.locator('#settings-message')).toHaveText(/nicht im Browser gespeichert/);
  expect(JSON.parse(await downloadSettings(page))).toEqual(config);

  await button(page, 'Standardwerte').focus();
  await page.keyboard.press('Tab');
  await expect(button(page, 'Als JSON exportieren')).toBeFocused();
  const pendingDownload = page.waitForEvent('download');
  await page.keyboard.press('Enter');
  await pendingDownload;
  await page.keyboard.press('Tab');
  await expect(button(page, 'JSON importieren')).toBeFocused();
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await (await chooser).setFiles({ name: 'settings.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  await imported(page);
  await expect(page.locator('#settings-file')).toHaveAttribute('aria-label', 'JSON-Einstellungsdatei');
  await expect(page.locator('#settings-message')).toHaveAttribute('role', 'status');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('#settings-form').evaluate(form => form.scrollWidth <= form.clientWidth)).toBe(true);
  for (const name of ['Als JSON exportieren', 'JSON importieren']) {
    const bounds = await button(page, name).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(360);
  }
  expect(network).toEqual([]);
});

test('exports the complete draft without changing the active world or saved settings', async ({ page }) => {
  await openSettings(page);
  await button(page, 'Im Browser speichern').click();
  const beforeStorage = await stored(page);
  const beforeStatus = await page.locator('#status').innerText();
  const beforeImage = await page.locator('#field').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const original = JSON.parse(await downloadSettings(page));
  await field(page, 'width').fill('18');
  await field(page, 'speedMultiplier').fill('3.25');
  await field(page, 'herbivore.initialEnergy').fill('7.125');
  await field(page, 'carnivore.initialEnergy').fill('18');
  const text = await downloadSettings(page);
  expect(JSON.parse(text)).toEqual({ version: 2, config: { ...original.config, width: 18, speedMultiplier: 3.25, herbivore: { ...original.config.herbivore, initialEnergy: 7.125 }, carnivore: { ...original.config.carnivore, initialEnergy: 18 } } });
  expect(text).toContain('\n  "version": 2');
  expect(await page.locator('#status').innerText()).toBe(beforeStatus);
  expect(await page.locator('#field').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(beforeImage);
  expect(await stored(page)).toBe(beforeStorage);
  await expect(page.getByLabel('Tempo', { exact: true })).toHaveValue('2');
  await expect(button(page, 'Weiter')).toBeVisible();

  const downloads: string[] = [];
  page.on('download', download => downloads.push(download.suggestedFilename()));
  for (const [name, value] of [['width', ''], ['width', '1.5'], ['grassGrowthPerSecond', '2']]) {
    await field(page, 'width').fill('18');
    await field(page, name).fill(value);
    await button(page, 'Als JSON exportieren').click();
    await expect(page.locator('#settings-message')).toHaveAttribute('data-error', 'true');
  }
  await page.waitForTimeout(100);
  expect(downloads).toEqual([]);
  expect(await stored(page)).toBe(beforeStorage);
  expect(await page.locator('#status').innerText()).toBe(beforeStatus);
});
