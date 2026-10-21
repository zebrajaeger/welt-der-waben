import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import english from '../src/locales/en.json' with { type: 'json' };
import german from '../src/locales/de.json' with { type: 'json' };

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const field = (page: Page, path: string) => page.locator(`[name="${path}"]`);
const number = (page: Page, id: string) => page.locator(`#${id} .history-number-text`);
const upload = (page: Page, text: string) => page.locator('#settings-file').setInputFiles({ name: 'settings.json', mimeType: 'application/json', buffer: Buffer.from(text) });
async function exportSettings(page: Page) {
  const download = page.waitForEvent('download');
  await page.locator('#settings-export').click();
  return readFile((await (await download).path())!, 'utf8');
}

test('production HTML supplies escaped English fallback from the catalog', async ({ request }) => {
  const response = await request.get('./');
  const html = await response.text();
  expect(html).toContain('<html lang="en">');
  expect(html).toContain(english['app.heading']);
  expect(html).toContain('Apply &amp; restart');
  expect(html).not.toContain('__I18N:');
  expect(html).not.toContain(german['app.heading']);
});

for (const [preferences, fallback, expected] of [
  [['de-CH'], 'de-CH', 'de'], [['en-GB'], 'en-GB', 'en'],
  [['fr-FR', 'de-DE', 'en-US'], 'fr-FR', 'de'], [['fr-FR'], 'fr-FR', 'en'],
  [[], 'de-DE', 'de'], [[], '', 'en'],
] as const) {
  test(`browser preferences ${preferences.join(',') || '(empty)'} / ${fallback || '(empty)'} select ${expected}`, async ({ page }) => {
    await page.addInitScript(({ preferences, fallback }) => {
      Object.defineProperty(navigator, 'languages', { get: () => preferences });
      Object.defineProperty(navigator, 'language', { get: () => fallback });
    }, { preferences, fallback });
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', expected);
    await expect(page.locator('h1')).toHaveText((expected === 'de' ? german : english)['app.heading']);
  });
}

for (const locale of ['en', 'de'] as const) {
  test.describe(locale, () => {
    test.use({ locale: locale === 'en' ? 'en-US' : 'de-DE' });
    const texts = locale === 'en' ? english : german;
    const separator = locale === 'en' ? '.' : ',';

    test('localizes static/dynamic texts, field errors, storage and asynchronous imports', async ({ page }) => {
      await page.goto('./');
      await button(page, texts['controls.pause']).click();
      await button(page, texts['controls.reset']).click();
      await expect(page).toHaveTitle(texts['app.title']);
      await expect(page.getByRole('link', { name: texts['app.source'], exact: true })).toBeVisible();
      await expect(page.locator('#status')).toHaveText(locale === 'en' ? 'Tick 0 · 0.00 s · 10 herbivores · 10 carnivores' : 'Tick 0 · 0,00 s · 10 Grasfresser · 10 Karnivoren');
      await expect(page.locator('#speed option').first()).toHaveText(`0${separator}25×`);
      const staticTexts = await page.locator('[data-i18n]').evaluateAll(elements => elements
        .filter(element => element.id !== 'toggle').map(element => [element.getAttribute('data-i18n')!, element.textContent]));
      for (const [key, text] of staticTexts) expect(text, key!).toBe(texts[key as keyof typeof texts]);
      await page.locator('#settings > summary').click();
      await field(page, 'width').fill('0');
      await button(page, texts['settings.apply']).click();
      await expect(page.locator('#settings-message')).toContainText(texts['fields.width']);
      await expect(field(page, 'width')).toBeFocused();
      await expect(field(page, 'width')).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('#status')).toContainText(`0${separator}00 s`);
      await field(page, 'width').fill('30');
      await button(page, texts['settings.save']).click();
      await expect(page.locator('#settings-message')).toHaveText(texts['settings.saved']);
      const exported = await exportSettings(page);
      const beforeStorage = await page.evaluate(() => localStorage.getItem('carnivore-sim.settings'));
      await upload(page, '{');
      await expect(page.locator('#settings-message')).toHaveText(texts['errors.json']);
      expect(await page.evaluate(() => localStorage.getItem('carnivore-sim.settings'))).toBe(beforeStorage);
      await page.evaluate(() => {
        const read = File.prototype.text;
        File.prototype.text = function () {
          return new Promise(resolve => Object.assign(window, { finishLocaleImport: () => read.call(this).then(resolve) }));
        };
      });
      await upload(page, exported);
      await expect(page.locator('#settings-message')).toHaveText(texts['settings.reading']);
      await field(page, 'width').fill('31');
      await page.evaluate(async () => { await (window as unknown as { finishLocaleImport(): Promise<void> }).finishLocaleImport(); });
      await expect(field(page, 'width')).toHaveValue('31');
      await expect(page.locator('#settings-message')).toHaveText('');
      await page.reload();
      await expect(page.locator('#settings-notice')).toHaveText(texts['storage.loaded']);
    });

    test('updates all five tooltip values under a stationary pointer in both chart modes', async ({ page }, testInfo) => {
      await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
      await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
      await page.locator('#toggle').click(); await page.locator('#reset').click();
      await page.locator('#history > summary').click(); await page.locator('#history-span').selectOption('10');
      await page.locator('#toggle').click(); await page.clock.runFor(7000);
      const hover = async (x: number) => {
        const canvas = page.locator('#history-canvas'); await canvas.scrollIntoViewIfNeeded();
        const box = (await canvas.boundingBox())!;
        await page.mouse.move(box.x + 48 + x * (box.width - 96), box.y + 26 + (box.height - 66) / 2);
      };
      const hoveredTick = async () => Number((await number(page, 'history-tooltip-tick').innerText()).replace(/[.,]/g, ''));
      await hover(0.5);
      await expect(page.getByRole('tooltip')).toBeVisible();
      await expect(page.locator('#history-tooltip-values dt')).toHaveText(['carnivoreCount', 'herbivoreCount', 'carnivoreEnergy', 'herbivoreEnergy', 'grassEnergy'].map(key => texts[`tooltip.${key}` as keyof typeof texts]));
      await expect(number(page, 'history-tooltip-seconds')).toHaveText(locale === 'en' ? /\.\d{2}$/ : /,\d{2}$/);
      const before = await hoveredTick(); await page.clock.runFor(1000);
      expect(await hoveredTick()).toBeGreaterThan(before + 100);
      await page.locator('#toggle').click();
      await page.locator('#history-mode').selectOption('sweep');
      await hover(0.25); expect(await hoveredTick()).toBe(750);
      await hover(0.75); expect(await hoveredTick()).toBe(450);
      const path = testInfo.outputPath(`${locale}-tooltip.png`);
      await page.screenshot({ path });
      await testInfo.attach(`${locale}-tooltip`, { path, contentType: 'image/png' });
      await page.mouse.move(0, 0); await expect(page.getByRole('tooltip')).toBeHidden();
    });

    test('preserves compact chart layout on desktop and narrow screens', async ({ page }, testInfo) => {
      await page.goto('./'); await page.locator('#toggle').click();
      await page.locator('#history > summary').click();
      await page.locator('#settings > summary').click();
      for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
        await page.setViewportSize({ width, height });
        await page.locator('#history-canvas').scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect(await page.locator('.field-container').evaluate(element => element.clientHeight)).toBeGreaterThanOrEqual(160);
        expect(await page.locator('.history-body').evaluate(element => element.clientHeight)).toBeLessThanOrEqual(Math.min(320, height * 0.38));
        const path = testInfo.outputPath(`${locale}-${width}-${height}.png`);
        await page.screenshot({ path });
        await testInfo.attach(`${locale}-${width}-${height}`, { path, contentType: 'image/png' });
      }
    });

    test('uses bundled translations without browser storage', async ({ page }) => {
      const requests: string[] = [];
      page.on('request', request => requests.push(request.url()));
      await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }));
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('#settings-notice')).toHaveText(texts['storage.unavailable']);
      await page.locator('#settings > summary').click();
      await page.locator('#settings-save').click();
      await expect(page.locator('#settings-message')).toHaveText(texts['errors.storage']);
      expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
      expect(requests.some(url => /\/locales\/|\.json(?:$|\?)/.test(url))).toBe(false);
    });
  });
}

for (const from of ['en', 'de'] as const) {
  test(`exports from ${from} and imports into the other language without changing settings`, async ({ browser, baseURL }) => {
    const to = from === 'en' ? 'de' : 'en';
    const source = await browser.newContext({ locale: from }), target = await browser.newContext({ locale: to });
    try {
      const page = await source.newPage(); await page.goto(baseURL!);
      await page.locator('#settings > summary').click();
      await field(page, 'herbivore.initialEnergy').fill('7.125'); await field(page, 'speedMultiplier').fill('3.25');
      const text = await exportSettings(page);
      const other = await target.newPage(); await other.goto(baseURL!);
      await other.locator('#settings > summary').click(); await upload(other, text);
      await expect(other.locator('#settings-message')).toHaveText((to === 'de' ? german : english)['settings.imported']);
      await expect(field(other, 'herbivore.initialEnergy')).toHaveValue('7.125');
      expect(await exportSettings(other)).toBe(text);
      const record = JSON.parse(text); expect(Object.keys(record)).toEqual(['version', 'config']);
      await other.locator('#settings-save').click();
      expect(JSON.parse((await other.evaluate(() => localStorage.getItem('carnivore-sim.settings')))!)).toEqual(record);
    } finally { await source.close(); await target.close(); }
  });
}
