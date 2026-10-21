import { strict as assert } from 'node:assert';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from '@playwright/test';

// Isolated test route: real markup, CSS, History and panel; no running simulation.
const root = fileURLToPath(new URL('../', import.meta.url));
const html = (await readFile(new URL('../index.html', import.meta.url), 'utf8'))
  .replace(/<script type="module" src="\/src\/main.ts"><\/script>/, '');
const server = await createServer({ root, configFile: false, base: '/', server: { host: '127.0.0.1', port: 0 } });
let browser;
const failures = [], errors = [], screenshots = [];
const metricsOnly = process.argv.includes('--metrics-only');
const locale = process.argv.includes('--english') ? 'en' : 'de';
try {
  await server.listen();
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ locale: 'de-DE' });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__history-layout', route => route.fulfill({ contentType: 'text/html', body: html }));
  await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/__history-layout`);
  await page.evaluate(async locale => {
    await import('/src/style.css');
    const { History } = await import('/src/history.ts');
    const { createHistoryPanel } = await import('/src/history-panel.ts');
    const { createLocalization, translateDocument } = await import('/src/i18n.ts');
    const i18n = createLocalization([locale]);
    translateDocument(document, i18n);
    const history = new History();
    const context = document.querySelector('#history-canvas').getContext('2d');
    const fillText = context.fillText;
    context.fillText = function (text, x, y, ...rest) {
      if (y === document.querySelector('.history-chart').clientHeight - 23) {
        window.layoutAxisLabels.push({ text, x, align: this.textAlign, font: this.font });
      }
      return fillText.call(this, text, x, y, ...rest);
    };
    const state = (value, tick = 99, count = 9) => ({ tick, grass: [value], nextId: 10000, reservations: {}, released: {},
      animals: Array.from({ length: 2 * count }, (_, i) => ({ id: i, species: i < count ? 'herbivore' : 'carnivore',
        energy: value / count, column: i, row: 0, angle: 0, readyAt: 0 })) });
    history.reset(state(9.99));
    const panel = createHistoryPanel(history, new AbortController().signal, i18n);
    document.querySelector('#history').open = true;
    for (const checkbox of document.querySelectorAll('#history-metrics input')) checkbox.checked = true;
    window.layoutFixture = (value, tick = 99, count = 9) => {
      window.layoutAxisLabels = []; history.reset(state(value, tick, count)); panel.refresh(true);
    };
    document.querySelector('.history-extra')?.setAttribute('open', '');
    window.layoutFixture(9.99);
  }, locale);
  const measure = () => page.evaluate(() => {
    const panel = document.querySelector('#history').getBoundingClientRect();
    const selectors = ['.history-chart'];
    return Object.fromEntries(selectors.flatMap(selector => [...document.querySelectorAll(selector)].map((element, index) => {
      const box = element.getBoundingClientRect();
      return [`${selector}[${index}]`, [box.x - panel.x, box.y - panel.y, box.width, box.height]];
    })));
  });
  const measureAll = async () => {
    const boxes = await measure();
    if (!metricsOnly) Object.assign(boxes, await page.evaluate(() => {
      const panel = document.querySelector('#history').getBoundingClientRect();
      return Object.fromEntries(['#history-time', '#history-range', '.history-number'].flatMap(selector =>
        [...document.querySelectorAll(selector)].map((element, index) => {
          const box = element.getBoundingClientRect();
          return [`${selector}[${index}]`, [box.x - panel.x, box.y - panel.y, box.width, box.height]];
        })));
    }));
    return boxes;
  };
  const screenshot = async (name) => {
    // Expand only for the review artifact, so every readout fits in one image.
    await page.locator('.history-body').evaluate(element => { element.style.maxHeight = 'none'; });
    const path = fileURLToPath(new URL(`../.browser-check/${name}.png`, import.meta.url));
    await page.locator('#history').screenshot({ path }); screenshots.push(path);
    await page.locator('.history-body').evaluate(element => { element.style.maxHeight = ''; element.scrollTop = 0; });
  };
  await mkdir(new URL('../.browser-check/', import.meta.url), { recursive: true });
  for (const [width, height] of [[1440, 900], [360, 740], [360, 480]]) {
    await page.setViewportSize({ width, height });
    for (const mode of ['scroll', 'sweep']) {
      await page.locator('#history-mode').selectOption(mode);
      for (const [name, before, after] of [
        ['decimal', [10], [10.56]], ['tens', [9.99, 99, 9], [10, 100, 10]],
        ['hundreds', [99.99, 5999, 99], [100, 6000, 100]],
        ['thousands', [999.99, 59999], [1000, 60000]],
        ['long', [10, 99], [1e25, 6e15]], ['back', [1e25, 6e15], [10, 99]],
      ]) {
        await page.evaluate(args => window.layoutFixture(...args), before);
        const baseline = await measureAll();
        await page.evaluate(args => window.layoutFixture(...args), after);
        const updated = await measureAll();
        for (const [field, box] of Object.entries(baseline)) {
          const delta = Math.max(...box.map((value, index) => Math.abs(value - updated[field][index])));
          if (delta > 1) failures.push({ width, height, mode, transition: name, field, delta });
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Horizontal page overflow');
        const numbers = await page.locator('#history .history-number').evaluateAll(elements => elements.map(element => {
          const text = element.querySelector('.history-number-text');
          const full = element.querySelector('.history-number-full');
          return { text: text?.textContent, full: full?.textContent, title: element.title,
            fits: element.scrollWidth <= element.clientWidth + 1,
            shortened: text?.getAttribute('aria-hidden') === 'true', fullHidden: full?.hidden };
        }));
        assert.equal(numbers.length, 4, 'Expected four time/tick fields; metrics belong to the hover tooltip');
        for (const number of numbers) {
          assert(number.fits, `Text overflow in ${number.text}`);
          assert(number.title, 'Full-value tooltip missing');
          if (number.shortened) assert(!number.fullHidden && number.full, 'Full accessible value missing');
        }
        if (name === 'thousands' && height !== 740) {
          await page.evaluate(args => window.layoutFixture(...args), before);
          await screenshot(`history-stable-${width}-${mode}-before`);
          await page.evaluate(args => window.layoutFixture(...args), after);
          await screenshot(`history-stable-${width}-${mode}-after`);
        }
      }
    }
  }
  assert.deepEqual(errors, []);
  await page.setViewportSize({ width: 1440, height: 900 });
  let axis;
  for (const mode of ['scroll', 'sweep']) {
    await page.locator('#history-mode').selectOption(mode);
    let anchors;
    for (const tick of [60000, 60006, 59999]) {
      await page.evaluate(tick => window.layoutFixture(10, tick), tick);
      axis = await page.evaluate(() => window.layoutAxisLabels.slice(-5));
      assert.equal(axis.length, 5, 'Expected five time axis labels');
      assert(axis.every(label => (locale === 'de' ? /,\d$/ : /\.\d$/).test(label.text)), `Variable X-axis decimals: ${JSON.stringify(axis)}`);
      assert(axis.every(label => label.align === 'right' && /monospace/.test(label.font)), 'Time labels need a fixed decimal anchor');
      if (anchors) assert.deepEqual(axis.map(label => label.x), anchors, 'Time label anchors moved');
      anchors = axis.map(label => label.x);
    }
  }
  await page.locator('.history-extra').evaluateAll(elements => elements.forEach(element => { element.open = false; }));
  const panelHeight = await page.locator('.history-body').evaluate(element => element.clientHeight);
  assert(panelHeight <= 320, `History uses too much vertical space: ${panelHeight}px`);
  const compactHeights = [];
  for (const [width, height] of [[1440, 900], [360, 480]]) {
    await page.setViewportSize({ width, height });
    await page.locator('.history-body').evaluate(element => { element.scrollTop = 0; });
    compactHeights.push(await page.locator('.history-body').evaluate(element => ({ width: innerWidth, height: element.clientHeight })));
    if (width === 360) {
      assert(await page.evaluate(() => {
        const body = document.querySelector('.history-body').getBoundingClientRect();
        const chart = document.querySelector('.history-chart').getBoundingClientRect();
        return chart.top >= body.top && chart.bottom <= body.bottom;
      }), 'The compact mobile panel must show the chart before its options');
    }
    await page.locator('#history').screenshot({ path: fileURLToPath(new URL(`../.browser-check/history-compact-${width}.png`, import.meta.url)) });
  }
  await writeFile(new URL('../.browser-check/history-layout-results.json', import.meta.url), JSON.stringify({ failures, errors, screenshots, panelHeight, compactHeights, axis }, null, 2));
  console.log(JSON.stringify({ failures: failures.slice(0, 12), failureCount: failures.length, panelHeight }));
  assert.equal(failures.length, 0, 'Numeric updates must preserve field positions and sizes');
} finally {
  await browser?.close(); await server.close();
}
