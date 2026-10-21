import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';

const directory = new URL('../src/locales/', import.meta.url);
const catalogs = Object.fromEntries(readdirSync(directory).filter(file => file.endsWith('.json')).map(file =>
  [file.replace('.json', ''), JSON.parse(readFileSync(new URL(file, directory), 'utf8')) as Record<string, string>]));
test.use({ locale: 'en-US' });
test('large language list scrolls internally and reveals the active option', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 480 }); await page.goto('./');
  const toggle = page.locator('#language-toggle'), choices = page.locator('#language-choices');
  await toggle.click(); await page.keyboard.press('End');
  const last = choices.locator('button').last(); await expect(last).toBeFocused();
  const visible = () => last.evaluate(element => {
    const box = element.getBoundingClientRect(), parent = element.parentElement!.getBoundingClientRect();
    return box.top >= parent.top && box.bottom <= parent.bottom + 1 && parent.bottom <= innerHeight && scrollY === 0;
  });
  expect(await visible()).toBe(true);
  await page.keyboard.press('Enter'); await expect(choices).toBeHidden(); await toggle.click();
  await expect(last).toBeFocused(); expect(await visible()).toBe(true);
  expect(await choices.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  await page.keyboard.press('Home'); await expect(choices.locator('button').first()).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && scrollY === 0)).toBe(true);
});
for (const [locale, catalog] of Object.entries(catalogs)) {
  test(`catalog ${locale} selects, translates errors and persists`, async ({ page }) => {
    const requests: string[] = [], errors: string[] = [];
    page.on('request', request => requests.push(request.url())); page.on('pageerror', error => errors.push(error.message));
    await page.goto('./'); await page.locator('#toggle').click();
    await page.locator('#language-toggle').click(); await page.locator(`[data-language="${locale}"]`).click();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('html')).toHaveAttribute('dir', catalog['language.direction']);
    await expect(page).toHaveTitle(catalog['app.title']);
    await expect(page.locator('h1')).toHaveText(catalog['app.heading']);
    await page.locator('#settings > summary').click();
    await page.locator('[name="width"]').fill('0'); await page.locator('#settings-form [type="submit"]').click();
    await expect(page.locator('#settings-message')).toContainText(catalog['fields.width']);
    const translated = await page.locator('[data-i18n]').evaluateAll(elements => elements.filter(element => element.id !== 'toggle')
      .map(element => [element.getAttribute('data-i18n')!, element.textContent]));
    for (const [key, text] of translated) expect(text, key!).toBe(catalog[key!]);
    await page.reload(); await expect(page.locator('html')).toHaveAttribute('lang', locale);
    expect(errors).toEqual([]);
    expect(requests.every(url => new URL(url).origin === new URL(page.url()).origin)).toBe(true);
    expect(requests.some(url => /\/locales\/|\.json(?:$|\?)/.test(url))).toBe(false);
  });
}

test('last language is reachable by touch within the small viewport', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 360, height: 480 }, locale: 'en-US' });
  try {
    const page = await context.newPage(); await page.goto(baseURL!); await page.locator('#language-toggle').tap();
    const last = page.locator('#language-choices button').last(), locale = await last.getAttribute('data-language');
    await last.scrollIntoViewIfNeeded(); await last.tap(); await expect(page.locator('html')).toHaveAttribute('lang', locale!);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  } finally { await context.close(); }
});
