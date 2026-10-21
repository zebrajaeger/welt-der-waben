import { strict as assert } from 'node:assert';
import { writeFile } from 'node:fs/promises';

// Measure the visible canvas against the independent available DOM rectangle.
export async function measureViewport(page, columns = 30, rows = 20) {
  await page.waitForFunction(({ columns, rows }) => {
    const canvas = document.querySelector('#field'), host = canvas.parentElement;
    const radius = Math.min((host.clientWidth - 12) / (Math.sqrt(3) * (columns + (rows > 1 ? 0.5 : 0))), (host.clientHeight - 12) / (1.5 * (rows - 1) + 2));
    return Math.abs(parseFloat(canvas.style.width) - (Math.sqrt(3) * (columns + (rows > 1 ? 0.5 : 0)) * radius + 12)) < 1
      && Math.abs(parseFloat(canvas.style.height) - ((1.5 * (rows - 1) + 2) * radius + 12)) < 1;
  }, { columns, rows });
  const size = await page.evaluate(() => {
    const canvas = document.querySelector('#field'), host = canvas.parentElement, main = document.querySelector('main');
    const box = canvas.getBoundingClientRect(), parent = host.getBoundingClientRect(), style = getComputedStyle(main);
    const number = value => parseFloat(value) || 0;
    const occupied = [...main.children].filter(e => e !== host && getComputedStyle(e).display !== 'none').reduce((sum, e) => {
      const css = getComputedStyle(e);
      return sum + e.getBoundingClientRect().height + number(css.marginTop) + number(css.marginBottom);
    }, 0);
    return { width: box.width, height: box.height, availableWidth: host.clientWidth, availableHeight: host.clientHeight,
      centeredX: box.x + box.width / 2 - parent.x - parent.width / 2,
      centeredY: box.y + box.height / 2 - parent.y - parent.height / 2,
      bitmapWidth: canvas.width, bitmapHeight: canvas.height, ratio: devicePixelRatio,
      expectedHeight: Math.max(162, innerHeight - number(style.paddingTop) - number(style.paddingBottom) - occupied),
      outerHeight: parent.height, pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
  });
  assert(size.width <= size.availableWidth + 0.1 && size.height <= size.availableHeight + 0.1);
  assert(Math.min(size.availableWidth - size.width, size.availableHeight - size.height) < 2);
  assert(Math.abs(size.centeredX) < 1 && Math.abs(size.centeredY) < 1);
  assert(Math.abs(size.outerHeight - size.expectedHeight) < 2, JSON.stringify(size));
  assert(size.availableHeight >= 160);
  assert.equal(size.pageWidth, size.viewportWidth);
  assert.equal(size.bitmapWidth, Math.round(size.width * size.ratio));
  assert.equal(size.bitmapHeight, Math.round(size.height * size.ratio));
  const scaleX = (size.width - 12) / (Math.sqrt(3) * (columns + (rows > 1 ? 0.5 : 0)));
  const scaleY = (size.height - 12) / (1.5 * (rows - 1) + 2);
  assert(Math.abs(scaleX - scaleY) < 0.01);
  return size;
}

export async function checkViewport(browser, url, errors) {
  const measurements = [];
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({ locale: 'de-DE', viewport: { width: 1440, height: 1000 }, deviceScaleFactor });
    // Capture the actual app's sampled frame, without adding a debug API to production.
    await context.route(/\/src\/playback\.ts(?:\?.*)?$/, async route => {
      const response = await route.fetch(), source = await response.text();
      const body = source.replace(/return sampleAnimation\(this\.current, this\.config\);/, 'const frame = sampleAnimation(this.current, this.config); window.__viewportFrame = { state: this.current, shapes: [...frame.shapes] }; return frame;');
      assert.notEqual(body, source); await route.fulfill({ response, body });
    });
    const page = await context.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => { Math.random = () => 0.37; });
    const snapshot = () => page.evaluate(() => JSON.stringify(window.__viewportFrame));
    try {
      await page.goto(url); await page.getByRole('button', { name: 'Pause', exact: true }).click();
      await page.getByRole('button', { name: 'Neustart', exact: true }).click();
      const frozen = await snapshot(), status = await page.locator('#status').innerText();
      for (const [width, height] of [[1440, 1000], [2560, 1440], [3440, 1440], [360, 740], [360, 480]]) {
        await page.setViewportSize({ width, height });
        const closed = await measureViewport(page);
        if (width > 1500) assert(closed.availableWidth > 1500);
        await page.locator('#settings summary').click();
        const open = await measureViewport(page);
        assert(open.availableHeight <= closed.availableHeight);
        const formSize = await page.locator('#settings-form').evaluate(form => ({ height: form.getBoundingClientRect().height, viewportHeight: innerHeight, scrollable: form.scrollHeight > form.clientHeight }));
        assert(formSize.height <= height * 0.4 + 1); assert(formSize.scrollable);
        // Tab through every input and action; focus must scroll the inner form into view.
        await page.locator('#settings summary').focus();
        for (let i = 0; i < 27; i++) {
          await page.keyboard.press('Tab');
          assert(await page.evaluate(() => {
            const e = document.activeElement, form = document.querySelector('#settings-form');
            if (!form.contains(e)) return false;
            const box = e.getBoundingClientRect(), clip = form.getBoundingClientRect();
            return box.top >= clip.top - 1 && box.bottom <= clip.bottom + 1 && box.left >= 0 && box.right <= innerWidth;
          }));
        }
        assert.equal(await snapshot(), frozen); assert.equal(await page.locator('#status').innerText(), status);
        if (deviceScaleFactor === 1) {
          await page.locator('#settings-form').evaluate(e => { e.scrollTop = 0; });
          await page.evaluate(() => scrollTo(0, 0));
          await page.screenshot({ path: `.browser-check/viewport-${width}x${height}-open.png`, fullPage: true });
        }
        await page.locator('#settings summary').click(); await measureViewport(page);
        if (deviceScaleFactor === 1) await page.screenshot({ path: `.browser-check/viewport-${width}x${height}-closed.png`, fullPage: true });
        measurements.push({ deviceScaleFactor, width, height, closed, open });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      const baseline = await measureViewport(page);
      await page.locator('#settings-notice').evaluate(e => { e.textContent = 'Hinweis zu Einstellungen und Speicherung. '.repeat(30); });
      const withNotice = await measureViewport(page); assert(withNotice.availableHeight < baseline.availableHeight);
      await page.locator('#settings-notice').evaluate(e => { e.textContent = ''; });
      assert.equal((await measureViewport(page)).availableHeight, baseline.availableHeight);
      // Build a real paused grass contact in the app, then resize and open settings.
      await page.locator('#settings summary').click();
      for (const [path, value] of Object.entries({ width: '3', height: '1', 'herbivore.initialCount': '1', 'carnivore.initialCount': '0' })) await page.locator(`[name="${path}"]`).fill(value);
      await page.getByRole('button', { name: 'Übernehmen & neu starten', exact: true }).click();
      await page.locator('#settings summary').click();
      for (let i = 0; i < 30; i++) {
        await page.getByRole('button', { name: 'Einzelschritt', exact: true }).click();
        if (await page.evaluate(() => window.__viewportFrame.state.animals[0]?.action?.phase === 'transfer')) break;
      }
      assert.equal(await page.evaluate(() => window.__viewportFrame.state.animals[0]?.action?.phase), 'transfer');
      const contact = await snapshot();
      for (const [width, height] of [[3440, 1440], [360, 480], [1440, 1000]]) {
        await page.setViewportSize({ width, height }); await measureViewport(page, 3, 1);
        assert.equal(await snapshot(), contact);
        await page.locator('#settings summary').click(); await measureViewport(page, 3, 1);
        assert.equal(await snapshot(), contact);
        await page.locator('#settings summary').click();
        assert(await page.evaluate(() => {
          const { state, shapes } = window.__viewportFrame, action = state.animals[0].action;
          const points = shapes[0][1], target = [Math.sqrt(3) * (action.to.column + (action.to.row % 2) / 2 + 0.5), 1.5 * action.to.row + 1];
          return points.some(([x, y]) => Math.hypot(x - target[0], y - target[1]) < 1e-8);
        }));
      }
      // Temporary hidden layouts must recover even when no animation loop is running.
      await page.locator('.field-container').evaluate(e => { e.style.display = 'none'; });
      await page.waitForTimeout(50);
      await page.locator('.field-container').evaluate(e => { e.style.display = ''; });
      await measureViewport(page, 3, 1); assert.equal(await snapshot(), contact);
      await page.waitForTimeout(100); assert.equal(await snapshot(), contact);
    } finally { await context.close(); }
  }
  await writeFile('.browser-check/viewport-measurements.json', JSON.stringify(measurements, null, 2));
  console.log('Viewport geprüft: maximale Einpassung, beide Pixelfaktoren, fünf Fenstergrößen, Formularfokus, Meldungen und eingefrorener Spitzenkontakt.');
}
