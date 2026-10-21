import { expect, test } from '@playwright/test';

test('serves a stable local SVG favicon under the Pages path', async ({ page }, testInfo) => {
  await page.goto('./');
  const icon = page.locator('head link[rel="icon"]');
  await expect(icon).toHaveCount(1);
  await expect(icon).toHaveAttribute('type', 'image/svg+xml');
  await expect(icon).toHaveAttribute('sizes', 'any');
  const href = await icon.getAttribute('href');
  const url = new URL(href!, page.url());
  expect(url.origin).toBe(new URL(page.url()).origin);
  expect(url.pathname).toMatch(/^\/welt-der-waben\/assets\/favicon-[^/]+\.svg$/);
  const response = await page.request.get(url.href);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toMatch(/^image\/svg\+xml\b/);
  expect(await response.text()).toContain('<svg');
  expect(await page.evaluate(async url => {
    const image = new Image(); image.src = url; await image.decode();
    return image.naturalWidth > 0 && image.naturalHeight > 0;
  }, url.href)).toBe(true);

  // Neither language direction, playback nor reload changes this fixed motif.
  await page.locator('#toggle').click();
  await page.locator('#reset').click();
  await page.locator('#language-toggle').click(); await page.locator('[data-language="ar"]').click();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(icon).toHaveAttribute('href', href!);
  await page.reload(); await expect(icon).toHaveAttribute('href', href!);

  // Inspect the actual production asset at tab sizes on both browser backgrounds.
  await page.evaluate(async url => {
    const preview = document.createElement('div'); preview.id = 'favicon-preview'; preview.dir = 'ltr';
    preview.style.cssText = 'position:fixed;inset:20px auto auto 20px;z-index:1000;display:grid;grid-template-columns:repeat(3,140px);font:14px system-ui';
    for (const background of ['#ffffff', '#101c1b']) for (const size of [16, 32, 48]) {
      const cell = document.createElement('div');
      cell.style.cssText = `background:${background};color:${background === '#ffffff' ? '#14251f' : '#e8f1df'};height:100px;display:flex;align-items:center;justify-content:center;gap:12px`;
      const image = new Image(); image.src = url; image.width = image.height = size; await image.decode();
      cell.append(image, `${size} px`); preview.append(cell);
    }
    document.body.append(preview);
  }, url.href);
  const path = testInfo.outputPath('favicon-sizes.png');
  await page.locator('#favicon-preview').screenshot({ path });
  await testInfo.attach('favicon-sizes', { path, contentType: 'image/png' });
});

test('production build loads its assets and preserves controls and settings under the Pages path', async ({ page, browser }, testInfo) => {
  const errors: string[] = [];
  const assets: { url: string; type: string; status: number; contentType: string }[] = [];
  const requests: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  page.on('request', request => requests.push(request.url()));
  page.on('response', response => {
    const type = response.request().resourceType();
    if (type === 'script' || type === 'stylesheet') assets.push({ url: response.url(), type, status: response.status(), contentType: response.headers()['content-type'] ?? '' });
  });
  const button = (name: string) => page.getByRole('button', { name, exact: true });
  const status = page.locator('#status');
  const tick = async () => Number((await status.innerText()).match(/^Tick (\d+)/)![1]);
  const field = page.locator('#field');

  const response = await page.goto('./');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Leben in den Waben' })).toBeVisible();
  await expect(field).toBeVisible();
  await expect.poll(tick).toBeGreaterThan(0);
  expect(await field.evaluate((canvas: HTMLCanvasElement) => canvas.width > 0 && canvas.height > 0)).toBe(true);
  // Styles must be present, not merely a nonempty canvas with unstyled HTML.
  expect(await field.evaluate(canvas => getComputedStyle(canvas).position)).toBe('absolute');
  expect(assets.some(asset => asset.type === 'script')).toBe(true);
  expect(assets.some(asset => asset.type === 'stylesheet')).toBe(true);

  await button('Pause').click();
  const pausedTick = await tick();
  const pausedImage = await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.waitForTimeout(100);
  expect(await tick()).toBe(pausedTick);
  expect(await field.evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())).toBe(pausedImage);
  await button('Einzelschritt').click();
  expect(await tick()).toBe(pausedTick + 1);
  await page.getByLabel('Tempo', { exact: true }).selectOption('4');
  expect(await tick()).toBe(pausedTick + 1);
  await button('Neustart').click();
  expect(await tick()).toBe(0);
  await expect(page.getByLabel('Tempo', { exact: true })).toHaveValue('4');
  await button('Weiter').click();
  await expect.poll(tick).toBeGreaterThan(0);
  await button('Pause').click();

  await page.locator('#settings summary').click();
  for (const [path, value] of Object.entries({ width: '12', height: '8', 'herbivore.initialCount': '4', 'carnivore.initialCount': '3', 'herbivore.initialEnergy': '7.5', 'carnivore.initialEnergy': '18', speedMultiplier: '3' })) {
    await page.locator(`[name="${path}"]`).fill(value);
  }
  await button('Übernehmen & neu starten').click();
  await expect(status).toHaveText('Tick 0 · 0,00 s · 4 Grasfresser · 3 Karnivoren');
  await expect(button('Weiter')).toBeVisible();
  await expect(page.getByLabel('Tempo', { exact: true })).toHaveValue('3');
  await button('Im Browser speichern').click();
  await expect(page.locator('#settings-message')).toHaveText('Einstellungen im Browser gespeichert.');
  await page.reload();
  await button('Pause').click();
  await button('Neustart').click();
  await expect(status).toHaveText('Tick 0 · 0,00 s · 4 Grasfresser · 3 Karnivoren');
  await expect(page.getByLabel('Tempo', { exact: true })).toHaveValue('3');
  await page.locator('#settings summary').click();
  await expect(page.locator('[name="width"]')).toHaveValue('12');
  await expect(page.locator('[name="herbivore.initialEnergy"]')).toHaveValue('7.5');
  await expect(page.locator('[name="carnivore.initialEnergy"]')).toHaveValue('18');

  // Another visitor starts with defaults, not the first visitor's stored parameters.
  const visitor = await browser.newContext({ locale: 'de-DE' });
  try {
    const other = await visitor.newPage();
    await other.goto(page.url());
    await other.getByRole('button', { name: 'Pause', exact: true }).click();
    await other.getByRole('button', { name: 'Neustart', exact: true }).click();
    await expect(other.locator('#status')).toHaveText('Tick 0 · 0,00 s · 10 Grasfresser · 10 Karnivoren');
  } finally { await visitor.close(); }

  const loaded = new Map<string, string>();
  for (const asset of assets) {
    expect(new URL(asset.url).pathname).toMatch(/^\/welt-der-waben\/assets\//);
    if (asset.status === 304) expect(loaded.get(asset.url)).toBe(asset.type);
    else {
      expect(asset.status).toBe(200);
      expect(asset.contentType).toMatch(asset.type === 'script' ? /(?:java|ecma)script/ : /text\/css/);
      loaded.set(asset.url, asset.type);
    }
  }
  expect(requests.some(url => /\/(?:src\/|@vite\/|@id\/)/.test(new URL(url).pathname))).toBe(false);
  expect(errors).toEqual([]);
  await testInfo.attach('production', { body: await page.screenshot(), contentType: 'image/png' });
});
