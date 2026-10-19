import { strict as assert } from 'node:assert';

export async function checkSettings(browser, url, errors) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const input = path => page.locator(`[name="${path}"]`);
  const button = name => page.getByRole('button', { name, exact: true });
  const status = () => page.locator('#status').innerText();
  const state = () => page.locator('#settings-state').innerText();
  const message = () => page.locator('#settings-message').innerText();
  const stored = () => page.evaluate(() => localStorage.getItem('carnivore-sim.settings'));
  const pause = async () => { if (await button('Pause').count()) await button('Pause').click(); };
  const open = async () => { if (!await page.locator('#settings').evaluate(e => e.open)) await page.locator('#settings summary').click(); };
  const apply = () => button('Übernehmen & neu starten').click();
  const save = () => button('Im Browser speichern').click();
  try {
    await page.goto(url); await pause();
    await button('Neustart').click();
    assert.equal(await page.locator('#settings').evaluate(e => e.open), false);
    const initial = await status();
    await page.locator('#settings summary').focus(); await page.keyboard.press('Enter');
    assert.equal(await page.locator('#settings').evaluate(e => e.open), true);
    assert.equal(await page.locator('#settings input').count(), 24);
    assert.equal(await status(), initial);
    assert.match(await state(), /Werte sind aktiv/);
    await input('width').fill(''); await apply();
    assert.match(await message(), /Spalten.*endliche Zahl/);
    assert.equal(await input('width').getAttribute('aria-invalid'), 'true');
    assert.equal(await input('width').evaluate(e => e === document.activeElement), true);
    assert.equal(await status(), initial); assert.equal(await stored(), null);
    await input('width').fill('1'); await input('height').fill('1'); await save();
    assert.match(await message(), /Startpopulation/); assert.equal(await stored(), null);
    await input('width').fill('12'); await input('height').fill('8');
    await input('grassGrowthPerSecond').fill('2'); await apply();
    assert.match(await message(), /Graswachstum/); assert.equal(await status(), initial);
    await input('grassGrowthPerSecond').fill('1');
    await input('herbivore.initialEnergy').fill('21'); await apply();
    assert.match(await message(), /Startenergie.*Maximalenergie/); assert.equal(await status(), initial);
    await input('herbivore.initialEnergy').fill('7.5'); await input('carnivore.initialEnergy').fill('18');
    await input('herbivore.initialCount').fill('4'); await input('carnivore.initialCount').fill('3');
    await input('herbivore.maxEnergy').fill('30'); await input('speedMultiplier').fill('3');
    assert.equal(await page.locator('#speed').inputValue(), '2');
    await page.locator('#settings summary').click(); await page.locator('#settings summary').press('Space');
    assert.equal(await input('width').inputValue(), '12'); assert.equal(await status(), initial);
    await save(); const saved = await stored();
    assert.equal(JSON.parse(saved).config.herbivore.initialEnergy, 7.5);
    assert.equal(JSON.parse(saved).config.carnivore.initialEnergy, 18);
    assert.match(await message(), /im Browser gespeichert/); assert.match(await state(), /noch nicht übernommen/);
    assert.equal(await status(), initial); assert.equal(await page.locator('#speed').inputValue(), '2');
    await apply();
    assert.match(await status(), /^Tick 0 .*4 Grasfresser · 3 Karnivoren/);
    assert.equal(await page.locator('#speed').inputValue(), '3');
    assert.equal(await button('Weiter').count(), 1); assert.match(await state(), /Werte sind aktiv/);
    const dimensions = await page.locator('#field').evaluate(c => [c.width, c.height]);
    await input('width').fill('13'); await input('herbivore.initialCount').fill('5');
    await page.locator('#speed').selectOption('4');
    assert.equal(await input('width').inputValue(), '13'); assert.equal(await input('speedMultiplier').inputValue(), '4');
    assert.equal(await stored(), saved);
    await button('Neustart').click();
    assert.match(await status(), /^Tick 0 .*4 Grasfresser · 3 Karnivoren/);
    assert.equal(await input('width').inputValue(), '13');
    assert.equal(await page.locator('#speed').inputValue(), '4');
    assert.deepEqual(await page.locator('#field').evaluate(c => [c.width, c.height]), dimensions);
    await apply(); assert.match(await status(), /^Tick 0 .*5 Grasfresser · 3 Karnivoren/);
    assert.equal(await stored(), saved);
    await button('Einzelschritt').click(); assert.match(await status(), /^Tick 1 /);
    await page.reload(); await pause(); await button('Neustart').click(); await open();
    assert.equal(await input('width').inputValue(), '12');
    assert.equal(await input('herbivore.maxEnergy').inputValue(), '30');
    assert.equal(await input('herbivore.initialEnergy').inputValue(), '7.5');
    assert.equal(await input('carnivore.initialEnergy').inputValue(), '18');
    assert.equal(await page.locator('#speed').inputValue(), '3');
    assert.match(await status(), /^Tick 0 .*4 Grasfresser · 3 Karnivoren/);
    await button('Standardwerte').click();
    assert.equal(await input('herbivore.initialEnergy').inputValue(), '10');
    assert.equal(await input('carnivore.initialEnergy').inputValue(), '10');
    assert.equal(await input('width').inputValue(), '30'); assert.equal(await stored(), saved);
    assert.match(await status(), /4 Grasfresser · 3 Karnivoren/);
    await apply(); assert.match(await status(), /^Tick 0 .*10 Grasfresser · 10 Karnivoren/);
    assert.equal(await stored(), saved); assert.equal(await page.locator('#speed').inputValue(), '2');
    await save();
    const defaults = JSON.parse(await stored()); assert.equal(defaults.config.width, 30);
    await page.reload(); await pause(); await open();
    assert.equal(await input('width').inputValue(), '30'); assert.equal(await page.locator('#speed').inputValue(), '2');
    await page.screenshot({ path: '.browser-check/settings-desktop-open.png', fullPage: true });
    await page.setViewportSize({ width: 360, height: 740 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    for (const field of await page.locator('#settings input, #settings button').all()) {
      const bounds = await field.boundingBox(); assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 360);
    }
    await page.screenshot({ path: '.browser-check/settings-mobile-open.png', fullPage: true });
    await page.locator('#settings summary').click();
    await page.screenshot({ path: '.browser-check/settings-mobile-closed.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: '.browser-check/settings-desktop-closed.png', fullPage: true });
    // A bad persisted record falls back as a whole and leaves unrelated data intact.
    await page.evaluate(() => { localStorage.setItem('carnivore-sim.settings', '{'); localStorage.setItem('other-app', 'untouched'); });
    await page.reload(); await pause(); await open();
    assert.match(await page.locator('#settings-notice').innerText(), /ungültig/);
    assert.equal(await input('width').inputValue(), '30');
    assert.equal(await page.evaluate(() => localStorage.getItem('other-app')), 'untouched');
    // Applying while running replaces the world but preserves running mode.
    await button('Weiter').click(); await input('herbivore.initialCount').fill('2');
    await apply(); assert.equal(await button('Pause').count(), 1);
    await page.waitForTimeout(100); await pause();
    assert(Number((await status()).match(/^Tick (\d+)/)[1]) > 0);
    await button('Neustart').click(); assert.match(await status(), /^Tick 0 .*2 Grasfresser/);
    // Existing settings from before configurable start energy retain their values.
    await page.evaluate(config => {
      delete config.herbivore.initialEnergy; delete config.carnivore.initialEnergy;
      config.width = 16; config.herbivore.maxEnergy = 30; config.carnivore.maxEnergy = 40;
      localStorage.setItem('carnivore-sim.settings', JSON.stringify({ version: 1, config }));
    }, defaults.config);
    await page.reload(); await pause(); await open();
    assert.equal(await input('width').inputValue(), '16');
    assert.equal(await input('herbivore.initialEnergy').inputValue(), '15');
    assert.equal(await input('carnivore.initialEnergy').inputValue(), '20');
  } finally { await context.close(); }

  for (const blocked of ['access', 'read', 'write']) {
    const isolated = await browser.newContext();
    await isolated.addInitScript(mode => {
      if (mode === 'access') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
      else Object.defineProperty(Storage.prototype, mode === 'read' ? 'getItem' : 'setItem', { value() { throw new DOMException('Denied', 'SecurityError'); } });
    }, blocked);
    const page = await isolated.newPage(); page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(url); await page.getByRole('button', { name: 'Pause', exact: true }).click();
      if (blocked !== 'write') assert.match(await page.locator('#settings-notice').innerText(), /nicht verfügbar/);
      await page.locator('#settings summary').click();
      await page.locator('[name="herbivore.initialCount"]').fill('2');
      if (blocked !== 'read') {
        await page.getByRole('button', { name: 'Im Browser speichern', exact: true }).click();
        assert.match(await page.locator('#settings-message').innerText(), /nicht.*gespeichert/);
      }
      await page.getByRole('button', { name: 'Übernehmen & neu starten', exact: true }).click();
      assert.match(await page.locator('#status').innerText(), /^Tick 0 .*2 Grasfresser/);
      await page.getByRole('button', { name: 'Einzelschritt', exact: true }).click();
      assert.match(await page.locator('#status').innerText(), /^Tick 1 /);
    } finally { await isolated.close(); }
  }
  console.log('Einstellungen geprüft: Formular, Validierung, Übernehmen, Speichern, Standards, Tempo, Tastatur, Mobilansicht und Speicherfehler.');
}
