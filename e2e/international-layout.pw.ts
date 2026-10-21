import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

const catalog = (locale: string): Record<string, string> => JSON.parse(readFileSync(new URL(`../src/locales/${locale}.json`, import.meta.url), 'utf8'));
const choose = async (page: Page, locale: string) => {
  await page.locator('#language-toggle').click(); await page.locator(`[data-language="${locale}"]`).click();
};
const number = (page: Page, id: string) => page.locator(`#${id} .history-number-text`);
type Paint = { text: string; x: number; y: number; align: string; direction: string };

test.use({ locale: 'en-US' });

for (const languages of [['fr', 'he', 'fr'], ['en', 'ar']]) {
  test(`direction changes ${languages.join(' → ')} preserve the world, draft, history and errors`, async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
    await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
    await page.locator('#history > summary').click(); await page.locator('#history-span').selectOption('10');
    await page.clock.runFor(6500); await page.locator('#toggle').click();
    await page.locator('#history-mode').selectOption('sweep'); await page.locator('[value="grassEnergy"]').check();
    await page.locator('#settings > summary').click(); await page.locator('#settings-save').click();
    await page.locator('[name="width"]').fill('0'); await page.locator('#settings-form [type="submit"]').click();
    const snapshot = () => page.evaluate(() => ({
      world: document.querySelector<HTMLCanvasElement>('#field')!.toDataURL(),
      tick: document.querySelector('#history-tick .history-number-text')!.textContent!
        .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, ''),
      draft: Array.from(document.querySelectorAll<HTMLInputElement>('#settings-fields input'), input => [input.name, input.value]),
      saved: localStorage.getItem('carnivore-sim.settings'),
      options: ['#history-mode', '#history-span'].map(selector => document.querySelector<HTMLSelectElement>(selector)!.value),
      selected: Array.from(document.querySelectorAll<HTMLInputElement>('#history-metrics input'), input => input.checked),
    }));
    const before = await snapshot();
    for (const locale of languages) {
      const texts = catalog(locale); await choose(page, locale);
      await expect(page.locator('html')).toHaveAttribute('dir', texts['language.direction']);
      await expect(page.locator('#settings-message')).toContainText(texts['fields.width']);
      await expect(page.locator('#settings-state')).toHaveText(texts['settings.invalidDraft']);
      await expect(page.locator('#toggle')).toHaveText(texts['controls.resume']);
      await expect(page.locator('[name="width"]')).toHaveAttribute('aria-invalid', 'true');
      expect(await snapshot()).toEqual(before);
    }
  });
}

for (const locale of ['fr', 'ru', 'ar', 'he', 'hi', 'bn', 'zh-Hans', 'zh-Hant', 'ja', 'th']) {
  test(`${locale} keeps controls, chart anchors and compact panels at three viewport sizes`, async ({ page }, testInfo) => {
    await page.addInitScript(() => {
      const paints: Paint[] = []; Object.assign(window, { historyPaints: paints });
      const clear = CanvasRenderingContext2D.prototype.clearRect, fill = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.clearRect = function (...args) {
        if (this.canvas.id === 'history-canvas') paints.length = 0;
        clear.apply(this, args);
      };
      CanvasRenderingContext2D.prototype.fillText = function (text, x, y, maxWidth) {
        if (this.canvas.id === 'history-canvas') paints.push({ text, x, y, align: this.textAlign, direction: this.direction });
        if (maxWidth === undefined) fill.call(this, text, x, y); else fill.call(this, text, x, y, maxWidth);
      };
    });
    await page.goto('./'); await page.locator('#toggle').click(); await page.locator('#reset').click(); await choose(page, locale);
    await page.locator('#history > summary').click(); await page.locator('[value="grassEnergy"]').check();
    await page.locator('#settings > summary').click();
    for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
      await page.setViewportSize({ width, height }); await page.evaluate(() => scrollTo(0, 0));
      await expect.poll(() => page.locator('#history-canvas').evaluate(canvas => canvas.getBoundingClientRect().height)).toBe(160);
      const geometry = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const language = rect('#language-toggle'), controls = rect('.controls'), heading = rect('h1');
        return { overflow: document.documentElement.scrollWidth > innerWidth,
          language: { left: language.left, right: language.right, top: language.top, height: language.height },
          controls: { right: controls.right, left: controls.left, top: controls.top }, headingRight: heading.right,
          buttons: ['#toggle', '#step', '#reset', '#speed'].map(selector => ({ top: rect(selector).top, height: rect(selector).height })),
          field: rect('.field-container').height, panel: document.querySelector('.history-body')!.clientHeight };
      });
      expect(geometry.overflow).toBe(false); expect(width - geometry.language.right).toBeLessThanOrEqual(20);
      expect(geometry.field).toBeGreaterThanOrEqual(160); expect(geometry.panel).toBeLessThanOrEqual(Math.min(320, height * .38));
      if (width > 960) {
        expect(geometry.controls.left).toBeGreaterThan(geometry.headingRight);
        expect(geometry.language.left - geometry.controls.right).toBe(24);
        for (const button of geometry.buttons) {
          expect(Math.abs(button.top - geometry.language.top)).toBeLessThanOrEqual(1);
          expect(button.height).toBe(geometry.language.height);
        }
      } else expect(geometry.controls.right).toBe(geometry.language.right);
      const paints = await page.evaluate(() => (window as unknown as { historyPaints: Paint[] }).historyPaints);
      const texts = catalog(locale), count = paints.find(paint => paint.text === texts['history.count'])!;
      const energy = paints.find(paint => paint.text === texts['history.energy'])!;
      expect(count.x).toBe(48); expect(count.align).toBe('left'); expect(count.direction).toBe(texts['language.direction']);
      expect(energy.x).toBeGreaterThan(count.x); expect(energy.align).toBe('right');
      for (const time of paints.filter(paint => paint.y === 137)) {
        expect(time.align).toBe('right'); expect(time.direction).toBe('ltr');
        expect(time.text).toBe(new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-arab' : locale,
          { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(0));
      }
      const path = testInfo.outputPath(`${locale}-${width}x${height}.png`);
      await page.screenshot({ path }); await testInfo.attach(`${locale}-${width}x${height}`, { path, contentType: 'image/png' });
      await page.locator('#language-toggle').click(); await page.keyboard.press('End');
      const last = page.locator('#language-choices button').last(); await expect(last).toBeFocused();
      expect(await last.evaluate(element => {
        const box = element.getBoundingClientRect(), parent = element.parentElement!.getBoundingClientRect();
        return box.top >= parent.top && box.bottom <= parent.bottom + 1 && parent.bottom <= innerHeight;
      })).toBe(true);
      const listPath = testInfo.outputPath(`${locale}-${width}x${height}-list.png`);
      await page.screenshot({ path: listPath }); await testInfo.attach(`${locale}-${width}x${height}-list`, { path: listPath, contentType: 'image/png' });
      await page.keyboard.press('Escape');
      await page.locator('#history-canvas').scrollIntoViewIfNeeded();
      const chartPath = testInfo.outputPath(`${locale}-${width}x${height}-chart.png`);
      await page.screenshot({ path: chartPath }); await testInfo.attach(`${locale}-${width}x${height}-chart`, { path: chartPath, contentType: 'image/png' });
    }
  });
}

test('Arabic tooltip updates at a stationary pointer in both modes with isolated numbers', async ({ page }, testInfo) => {
  await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
  await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
  await choose(page, 'ar'); await page.locator('#toggle').click(); await page.locator('#reset').click();
  await page.locator('#history > summary').click(); await page.locator('#history-span').selectOption('10');
  await page.locator('#toggle').click(); await page.clock.runFor(7000);
  const hover = async (fraction: number) => {
    const canvas = page.locator('#history-canvas'); await canvas.scrollIntoViewIfNeeded(); const box = (await canvas.boundingBox())!;
    await page.mouse.move(box.x + 48 + fraction * (box.width - 96), box.y + 60);
  };
  await hover(.5); await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(page.locator('#history-tooltip-values dt')).toHaveText(['carnivoreCount', 'herbivoreCount', 'carnivoreEnergy', 'herbivoreEnergy', 'grassEnergy'].map(key => catalog('ar')[`tooltip.${key}`]));
  await expect(number(page, 'history-tooltip-seconds')).toHaveText(/٫[٠-٩]{2}$/);
  const tick = await number(page, 'history-tooltip-tick').innerText(); await page.clock.runFor(1000);
  expect(await number(page, 'history-tooltip-tick').innerText()).not.toBe(tick);
  await page.locator('#toggle').click(); await page.locator('#history-mode').selectOption('sweep');
  await hover(.25); await expect(number(page, 'history-tooltip-tick')).toHaveText('٧٥٠');
  await hover(.75); await expect(number(page, 'history-tooltip-tick')).toHaveText('٤٥٠');
  expect(await page.locator('#history-tooltip .history-number').evaluateAll(elements => elements.every(element =>
    getComputedStyle(element).direction === 'ltr' && element.scrollWidth <= element.clientWidth + 1))).toBe(true);
  const path = testInfo.outputPath('ar-tooltip.png'); await page.screenshot({ path }); await testInfo.attach('ar-tooltip', { path, contentType: 'image/png' });
});

test('Arabic works without storage and requests only bundled resources', async ({ page }) => {
  const requests: string[] = []; page.on('request', request => requests.push(request.url()));
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } }));
  await page.goto('./'); await choose(page, 'ar'); await page.locator('#settings > summary').click();
  await expect(page.locator('#settings-notice')).toHaveText(catalog('ar')['storage.unavailable']);
  await page.locator('#settings-save').click(); await expect(page.locator('#settings-message')).toHaveText(catalog('ar')['errors.storage']);
  expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
  expect(requests.some(url => /\/locales\/|\.json(?:$|\?)/.test(url))).toBe(false);
});

test('settings JSON survives Arabic to traditional Chinese export and import unchanged', async ({ page }) => {
  await page.goto('./'); await page.locator('#toggle').click(); await choose(page, 'ar'); await page.locator('#settings > summary').click();
  await page.locator('[name="herbivore.initialEnergy"]').fill('7.125');
  const download = async () => {
    const pending = page.waitForEvent('download'); await page.locator('#settings-export').click();
    return readFile((await (await pending).path())!, 'utf8');
  };
  const exported = await download(); await choose(page, 'zh-Hant'); await page.locator('[name="herbivore.initialEnergy"]').fill('9');
  await page.locator('#settings-file').setInputFiles({ name: 'settings.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await expect(page.locator('#settings-message')).toHaveText(catalog('zh-Hant')['settings.imported']);
  await expect(page.locator('[name="herbivore.initialEnergy"]')).toHaveValue('7.125'); expect(await download()).toBe(exported);
  await page.locator('#settings-save').click();
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('carnivore-sim.settings')))!)).toEqual(JSON.parse(exported));
});

test('all locale glyphs fit reserved metric and time slots, including large values', async ({ page }) => {
  const { readdirSync } = await import('node:fs');
  const { formatHistoryNumber } = await import('../src/history-format.ts');
  const samples = readdirSync(new URL('../src/locales/', import.meta.url)).filter(file => file.endsWith('.json')).flatMap(file => {
    const locale = file.replace('.json', '');
    return [12, 16].flatMap(capacity => [0, 999999.99, 1234567, 1e100, Number.MAX_VALUE].map(value =>
      ({ locale, capacity, text: formatHistoryNumber(value, 'decimal', capacity, locale).text })));
  });
  await page.goto('./');
  const overflowing = await page.evaluate(samples => samples.filter(({ locale, capacity, text }) => {
    const slot = document.createElement('span'); slot.className = `history-number${capacity === 16 ? ' history-number--time' : ''}`;
    slot.lang = locale; slot.textContent = text; document.body.append(slot);
    const overflow = slot.scrollWidth > slot.clientWidth + 1; slot.remove(); return overflow;
  }), samples);
  expect(overflowing).toEqual([]);
});
