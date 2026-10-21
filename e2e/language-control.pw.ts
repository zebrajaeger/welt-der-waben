import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });
async function choose(page: Page, language: 'de' | 'en') {
  await page.locator('#language-toggle').click();
  await page.locator(`[data-language="${language}"]`).click();
}
const value = (page: Page, id: string) => page.locator(`#${id} .history-number-text`);

test('switches all UI in place, preserves paused world, invalid draft, history and saved settings', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
  await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
  await page.locator('#history > summary').click(); await page.locator('#history-span').selectOption('10');
  await page.clock.runFor(6500); await page.locator('#toggle').click();
  await page.locator('#history-mode').selectOption('sweep');
  await page.locator('[value="grassEnergy"]').check();
  await page.locator('#settings > summary').click(); await page.locator('#settings-save').click();
  await page.locator('[name="width"]').fill('0'); await page.locator('#settings-form [type="submit"]').click();
  await expect(page.locator('#settings-message')).toContainText('Columns');
  const snapshot = () => page.evaluate(() => ({
    tick: document.querySelector('#status')!.textContent!.match(/^Tick (\d+)/)![1],
    world: document.querySelector<HTMLCanvasElement>('#field')!.toDataURL(),
    draft: Array.from(document.querySelectorAll<HTMLInputElement>('#settings-fields input'), input => [input.name, input.value]),
    saved: localStorage.getItem('carnivore-sim.settings'),
    mode: document.querySelector<HTMLSelectElement>('#history-mode')!.value,
    span: document.querySelector<HTMLSelectElement>('#history-span')!.value,
    selected: Array.from(document.querySelectorAll<HTMLInputElement>('#history-metrics input'), input => input.checked),
  }));
  const before = await snapshot();
  const historyTick = await value(page, 'history-tick').textContent();
  await choose(page, 'de');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#settings-message')).toContainText('Spalten');
  await expect(page.locator('[name="width"]')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#toggle')).toHaveText('Weiter');
  await expect(page.locator('#settings-state')).toContainText('ungültig');
  await expect(page.locator('[for="setting-width"]')).toHaveText('Spalten');
  await expect(page.locator('#history-tooltip-values dt').nth(2)).toHaveText('Σ Energie Karnivoren');
  await expect(value(page, 'history-seconds')).toHaveText(/,\d{2}$/);
  await expect(page.locator('#speed option').first()).toHaveText('0,25×');
  expect(await snapshot()).toEqual(before);
  expect(await value(page, 'history-tick').textContent()).toBe(historyTick);
  expect(await page.evaluate(() => localStorage.getItem('carnivore-sim.language'))).toBe('de');
  await choose(page, 'en');
  await expect(page.locator('#settings-message')).toContainText('Columns');
  await expect(value(page, 'history-seconds')).toHaveText(/\.\d{2}$/);
  expect(await snapshot()).toEqual(before);
  await page.clock.runFor(1000); expect(await snapshot()).toEqual(before);
  await choose(page, 'de'); await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('h1')).toHaveText('Leben in den Waben');
  expect(errors).toEqual([]);
});

test('preserves a running session and translates history tooltip values after switching', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-21T12:00:00Z') });
  await page.goto('./'); await page.clock.pauseAt(new Date('2026-10-21T12:00:01Z'));
  await page.locator('#history > summary').click(); await page.locator('#history-span').selectOption('10');
  await page.clock.runFor(6500);
  const tick = await value(page, 'history-tick').textContent();
  await choose(page, 'de');
  await expect(page.locator('#toggle')).toHaveText('Pause');
  expect(await value(page, 'history-tick').textContent()).toBe(tick);
  await page.clock.runFor(500);
  expect(await value(page, 'history-tick').textContent()).not.toBe(tick);
  const canvas = page.locator('#history-canvas'); await canvas.scrollIntoViewIfNeeded();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.5, box.y + 60);
  await expect(page.getByRole('tooltip')).toBeVisible();
  await expect(value(page, 'history-tooltip-seconds')).toHaveText(/,\d{2}$/);
  await expect(page.locator('#history-tooltip-values dt').nth(2)).toHaveText('Σ Energie Karnivoren');
  const previous = await value(page, 'history-tooltip-tick').innerText();
  await page.clock.runFor(500);
  expect(await value(page, 'history-tooltip-tick').innerText()).not.toBe(previous);
});

test('shows language autonyms and flags and supports keyboard, Escape and outside click', async ({ page }) => {
  await page.goto('./');
  const toggle = page.locator('#language-toggle'), choices = page.locator('#language-choices');
  await toggle.focus(); await page.keyboard.press('Enter');
  await expect(choices).toBeVisible();
  const english = page.getByRole('button', { name: 'English', exact: true });
  const german = page.getByRole('button', { name: 'Deutsch', exact: true });
  await expect(english).toBeFocused(); await expect(english).toHaveAttribute('aria-pressed', 'true');
  await expect(german).toHaveAttribute('lang', 'de');
  expect(await choices.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.keyboard.press('End'); await expect(choices.locator('button').last()).toBeFocused();
  await page.keyboard.press('Home'); await expect(choices.locator('button').first()).toBeFocused();
  await german.focus();
  await page.keyboard.press('Enter');
  await expect(choices).toBeHidden(); await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-label', 'Sprache wählen');
  await toggle.click(); await expect(german).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape'); await expect(choices).toBeHidden(); await expect(toggle).toBeFocused();
  await toggle.click(); await page.locator('h1').click(); await expect(choices).toBeHidden();
});

test('keeps playback right-aligned beside the heading and leaves room for the language selector', async ({ page }, testInfo) => {
  await page.goto('./'); await page.locator('#toggle').click();
  for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
    await page.setViewportSize({ width, height });
    for (const language of ['en', 'de'] as const) {
      await choose(page, language); await page.locator('#language-toggle').click();
      const geometry = await page.evaluate(() => {
        const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
        const toggle = box('#language-toggle'), controls = box('.controls'), heading = box('h1'), choices = box('#language-choices'), field = box('.field-container');
        return { toggle: { right: toggle.right, top: toggle.top, left: toggle.left },
          controls: { left: controls.left, top: controls.top, right: controls.right, bottom: controls.bottom },
          heading: { right: heading.right, top: heading.top, bottom: heading.bottom },
          speedRight: box('.speed-control').right,
          buttonTops: ['#toggle', '#step', '#reset', '#speed'].map(selector => box(selector).top),
          choices: { right: choices.right, left: choices.left }, fieldHeight: field.height,
          pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
      });
      expect(geometry.pageWidth).toBeLessThanOrEqual(width);
      expect(width - geometry.toggle.right).toBeLessThanOrEqual(20);
      expect(geometry.toggle.left - geometry.heading.right).toBeGreaterThanOrEqual(12);
      if (width > 960) {
        expect(geometry.controls.left).toBeGreaterThan(geometry.heading.right);
        expect(geometry.controls.top).toBeLessThan(geometry.heading.bottom);
        expect(geometry.controls.bottom).toBeGreaterThan(geometry.heading.top);
        expect(geometry.toggle.left - geometry.controls.right).toBe(24);
        for (const top of geometry.buttonTops) expect(Math.abs(top - geometry.toggle.top)).toBeLessThanOrEqual(1);
      } else {
        expect(geometry.toggle.top).toBeLessThanOrEqual(20);
        expect(geometry.controls.top).toBeGreaterThan(geometry.toggle.top);
        expect(geometry.controls.right).toBe(geometry.toggle.right);
      }
      expect(Math.abs(geometry.speedRight - geometry.controls.right)).toBeLessThanOrEqual(1);
      expect(geometry.choices.left).toBeGreaterThanOrEqual(0); expect(geometry.choices.right).toBeLessThanOrEqual(width);
      expect(geometry.fieldHeight).toBeGreaterThanOrEqual(160);
      const path = testInfo.outputPath(`languages-${language}-${width}x${height}.png`);
      await page.screenshot({ path }); await testInfo.attach(`languages-${language}-${width}x${height}`, { path, contentType: 'image/png' });
      await page.keyboard.press('Escape');
    }
  }
});

for (const mode of ['access', 'read', 'write', 'unknown']) {
  test(`supports language selection with ${mode} storage`, async ({ page }) => {
    await page.addInitScript(mode => {
      if (mode === 'access') Object.defineProperty(window, 'localStorage', { get() { throw new Error('denied'); } });
      else if (mode === 'unknown') localStorage.setItem('carnivore-sim.language', 'unknown');
      else Object.defineProperty(Storage.prototype, mode === 'read' ? 'getItem' : 'setItem', { value() { throw new Error('denied'); } });
    }, mode);
    await page.goto('./'); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await choose(page, 'de'); await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('#toggle')).toBeEnabled();
    await choose(page, 'en'); await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
}
