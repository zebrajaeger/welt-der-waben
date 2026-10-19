import { expect, test } from '@playwright/test';

const repository = 'https://github.com/zebrajaeger/welt-der-waben';
const linkName = 'Quellcode auf GitHub (neuer Tab)';

test('opens the source repository with mouse and keyboard without changing the paused simulation', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route(repository, route => route.fulfill({ contentType: 'text/html', body: '<title>Repository</title>' }));
  await page.goto('./');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const link = page.getByRole('link', { name: linkName, exact: true });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute('href', repository);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('rel', /noopener/);
  await expect(link).toHaveAttribute('rel', /noreferrer/);
  await expect(link).toHaveAttribute('title', linkName);
  const bounds = await link.boundingBox();
  expect(bounds!.width).toBeGreaterThanOrEqual(24);
  expect(bounds!.height).toBeGreaterThanOrEqual(24);
  const snapshot = () => page.evaluate(() => ({
    url: location.href,
    status: document.querySelector('#status')!.textContent,
    image: document.querySelector<HTMLCanvasElement>('#field')!.toDataURL(),
    saved: localStorage.getItem('carnivore-sim.settings'),
    draft: Array.from(document.querySelectorAll<HTMLInputElement>('#settings-fields input'), input => [input.name, input.value]),
  }));
  const before = await snapshot();
  for (const method of ['mouse', 'keyboard']) {
    if (method === 'keyboard') {
      await page.getByRole('button', { name: 'Weiter', exact: true }).focus();
      await page.keyboard.press('Shift+Tab');
      await expect(link).toBeFocused();
      expect(await link.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
    }
    const pending = context.waitForEvent('page');
    if (method === 'mouse') await link.click();
    else await page.keyboard.press('Enter');
    const popup = await pending;
    await popup.waitForURL(repository);
    expect(await popup.evaluate(() => window.opener)).toBeNull();
    await popup.close();
    expect(await snapshot()).toEqual(before);
    await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('preserves header and field height with no overlap on desktop and narrow screens', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const status = await page.locator('#status').innerText();
  const dimensions = () => page.evaluate(() => ({
    header: document.querySelector('header')!.getBoundingClientRect().height,
    field: document.querySelector('.field-container')!.getBoundingClientRect().height,
  }));
  for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
    await page.setViewportSize({ width, height });
    for (const open of [false, true]) {
      await page.locator('#settings').evaluate((element, value) => { (element as HTMLDetailsElement).open = value; }, open);
      await page.evaluate(() => scrollTo(0, 0));
      const link = page.getByRole('link', { name: linkName, exact: true });
      // Removing the link also removes :has(.source-link)'s reserved inline space.
      const html = await link.evaluate(element => { const html = element.outerHTML; element.remove(); return html; });
      const baseline = await dimensions();
      await page.locator('.eyebrow').evaluate((element, html) => element.insertAdjacentHTML('beforeend', html), html);
      await expect(link).toBeVisible();
      const visible = await dimensions();
      await page.getByRole('button', { name: 'Weiter', exact: true }).focus();
      await page.keyboard.press('Shift+Tab');
      await expect(link).toBeFocused();
      const focused = await dimensions();
      for (const measured of [visible, focused]) {
        expect(Math.abs(measured.header - baseline.header)).toBeLessThanOrEqual(1);
        expect(Math.abs(measured.field - baseline.field)).toBeLessThanOrEqual(1);
      }
      const geometry = await link.evaluate(element => {
        const link = element.getBoundingClientRect();
        const neighbours = ['.eyebrow span', 'h1', '.controls', '.field-container'].map(selector => document.querySelector(selector)!.getBoundingClientRect());
        const style = getComputedStyle(element);
        return {
          visible: link.top >= 0 && link.left >= 0 && link.right <= innerWidth && link.bottom <= innerHeight,
          overlap: neighbours.some(box => Math.min(link.right, box.right) > Math.max(link.left, box.left) && Math.min(link.bottom, box.bottom) > Math.max(link.top, box.top)),
          focusStyle: style.outlineStyle,
          focusWidth: parseFloat(style.outlineWidth),
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: innerWidth,
        };
      });
      expect(geometry.visible).toBe(true);
      expect(geometry.overlap).toBe(false);
      expect(geometry.focusStyle).toBe('solid');
      expect(geometry.focusWidth).toBeGreaterThanOrEqual(2);
      expect(geometry.pageWidth).toBeLessThanOrEqual(geometry.viewportWidth);
      await expect(page.locator('#status')).toHaveText(status);
      const name = `source-link-${width}x${height}-${open ? 'open' : 'closed'}`;
      const path = testInfo.outputPath(`${name}.png`);
      await page.screenshot({ path, fullPage: true });
      await testInfo.attach(name, { path, contentType: 'image/png' });
    }
  }
});
