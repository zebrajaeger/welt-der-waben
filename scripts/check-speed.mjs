import { strict as assert } from 'node:assert';

/** Uses the same application page as the broader browser check and restores its default tempo. */
export async function checkSpeed(page, browser, errors) {
  const speed = page.getByLabel('Tempo', { exact: true });
  const status = () => page.locator('#status').innerText();
  assert.equal(await speed.inputValue(), '2');
  assert.deepEqual(await speed.locator('option').allTextContents(), [
    '0,25 Schritte/s', '0,5 Schritte/s', '1 Schritt/s', '2 Schritte/s', '4 Schritte/s', '8 Schritte/s',
  ]);
  // The caller has paused and reset, so a selection alone must neither prepare nor advance a step.
  const initial = await status();
  const picture = await page.locator('#field').evaluate(canvas => canvas.toDataURL());
  for (const value of ['0.25', '0.5', '1', '2', '4', '8']) {
    await speed.selectOption(value);
    assert.equal(await speed.inputValue(), value);
    assert.equal(await status(), initial);
    assert.equal(await page.locator('#field').evaluate(canvas => canvas.toDataURL()), picture);
    assert.equal(await page.getByRole('button', { name: 'Weiter', exact: true }).isVisible(), true);
  }
  await speed.focus(); await speed.press('Home');
  assert.equal(await speed.inputValue(), '0.25');
  await speed.press('ArrowDown'); assert.equal(await speed.inputValue(), '0.5');
  await speed.press('End'); assert.equal(await speed.inputValue(), '8');

  await speed.selectOption('0.25');
  await page.getByRole('button', { name: 'Einzelschritt', exact: true }).click();
  await page.waitForTimeout(180);
  assert.equal(await status(), initial);
  assert.equal(await speed.isEnabled(), true);
  await speed.selectOption('8');
  await page.waitForFunction(() => document.querySelector('#status').textContent.startsWith('Schritt 1 '));
  assert.equal(await page.getByRole('button', { name: 'Weiter', exact: true }).isVisible(), true);
  await page.waitForTimeout(250);
  assert.match(await status(), /^Schritt 1 /);
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();
  assert.equal(await speed.inputValue(), '8');
  await speed.selectOption('0.25');
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.waitForTimeout(150);
  // Slow down and speed up a running transition without changing its mode.
  await speed.selectOption('0.5'); await speed.selectOption('0.25');
  assert.equal(await page.getByRole('button', { name: 'Pause', exact: true }).isVisible(), true);
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  const paused = await page.locator('#field').evaluate(canvas => canvas.toDataURL());
  const pausedStatus = await status();
  await speed.selectOption('8');
  await page.waitForTimeout(180);
  assert.equal(await status(), pausedStatus);
  assert.equal(await page.locator('#field').evaluate(canvas => canvas.toDataURL()), paused);
  assert.equal(await page.getByRole('button', { name: 'Weiter', exact: true }).isVisible(), true);

  await page.screenshot({ path: '.browser-check/speed-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.waitForTimeout(100);
  for (const selector of ['#speed', '#toggle', '#step', '#reset']) {
    const bounds = await page.locator(selector).boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 360);
  }
  assert.equal(await speed.isEnabled(), true);
  await page.screenshot({ path: '.browser-check/speed-mobile.png', fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  // Test an actual non-default configuration through the served module, without changing project files.
  const custom = await browser.newPage();
  custom.on('pageerror', error => errors.push(error.message));
  await custom.route('**/src/config.ts', async route => {
    const response = await route.fetch(), original = await response.text();
    const body = original.replace(/stepsPerSecond:\s*2\b/, 'stepsPerSecond: 3');
    assert.notEqual(body, original);
    await route.fulfill({ response, body });
  });
  await custom.goto(page.url());
  const customSpeed = custom.getByLabel('Tempo', { exact: true });
  assert.equal(await customSpeed.inputValue(), '3');
  assert.equal(await customSpeed.locator('option').count(), 7);
  assert.equal(await customSpeed.locator('option[value="3"]').innerText(), '3 Schritte/s');
  await customSpeed.selectOption('4');
  await custom.getByRole('button', { name: 'Neustart', exact: true }).click();
  assert.equal(await customSpeed.inputValue(), '4');
  await custom.reload();
  assert.equal(await customSpeed.inputValue(), '3');
  await custom.close();
  await page.reload();
  assert.equal(await speed.inputValue(), '2');
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.getByRole('button', { name: 'Neustart', exact: true }).click();

  const transitions = await page.evaluate(async () => {
    const { defaultConfig } = await import('/src/config.ts');
    const { Playback } = await import('/src/playback.ts');
    const { render, layout } = await import('/src/render.ts');
    const { hexCenter } = await import('/src/hex.ts');
    const config = { ...defaultConfig, width: 3, height: 1,
      herbivore: { ...defaultConfig.herbivore, initialCount: 0 }, carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
    const resident = (id, column, species, energy = 5) => ({ id, column, row: 0, species, energy, activeFrom: 1 });
    const host = document.createElement('section'); host.id = 'speed-check';
    host.style.cssText = 'background:#101c1b;padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px';
    document.body.append(host);
    const field = layout(config, 420, 160);
    function picture(label, frame) {
      const box = document.createElement('div'), title = document.createElement('p'), canvas = document.createElement('canvas');
      title.textContent = label; canvas.width = 420; canvas.height = 160; canvas.style.width = '100%';
      box.append(title, canvas); host.append(box);
      render(canvas.getContext('2d'), frame.state, config, field, frame.shapes);
    }
    const dividing = new Playback({ step: 0, nextId: 100, grass: [10, 10, 10], animals: [resident(1, 0, 'herbivore', 19)] }, config, () => 0);
    dividing.tick(0); dividing.tick(200);
    const beforeSplit = dividing.frame;
    picture('Teilung · vor Wechsel · 2 Schritte/s', beforeSplit);
    dividing.setStepsPerSecond(0.25, 200);
    const afterSplit = dividing.frame;
    picture('Teilung · nach Wechsel · 0,25 Schritte/s', afterSplit);
    const splitContinuous = JSON.stringify([...beforeSplit.shapes]) === JSON.stringify([...afterSplit.shapes]);
    dividing.tick(600);
    picture('Teilung · Ankunft mit Grasaufnahme', dividing.frame);
    const splitGrassEaten = dividing.frame.state.grass.every(value => value === 0);

    const hunting = new Playback({ step: 0, nextId: 100, grass: [0, 9, 0], animals: [resident(1, 0, 'herbivore'), resident(2, 2, 'carnivore')] }, config, () => 0);
    hunting.tick(0); hunting.tick(240);
    const beforeHunt = hunting.frame;
    picture('Jagd · vor Wechsel · 2 Schritte/s', beforeHunt);
    hunting.setStepsPerSecond(8, 240);
    const afterHunt = hunting.frame;
    picture('Jagd · nach Wechsel · 8 Schritte/s', afterHunt);
    const huntContinuous = JSON.stringify([...beforeHunt.shapes]) === JSON.stringify([...afterHunt.shapes]);
    hunting.tick(242.5);
    const contact = hunting.frame;
    picture('Jagd · synchroner Kontakt', contact);
    const target = hexCenter({ column: 1, row: 0 });
    const contactDistance = Math.min(...contact.shapes.get(2).map(point => Math.hypot(point[0] - target[0], point[1] - target[1])));
    return { splitContinuous, huntContinuous, splitGrassEaten,
      preyVisibleBefore: beforeHunt.state.animals.some(a => a.id === 1),
      preyVisibleAfter: contact.state.animals.some(a => a.id === 1), contactDistance };
  });
  assert.equal(transitions.splitContinuous, true); assert.equal(transitions.huntContinuous, true);
  assert.equal(transitions.splitGrassEaten, true); assert.equal(transitions.preyVisibleBefore, true);
  assert.equal(transitions.preyVisibleAfter, false); assert(transitions.contactDistance < 1e-9);
  await page.locator('#speed-check').screenshot({ path: '.browser-check/speed-transitions.png' });
  await page.locator('#speed-check').evaluate(host => host.remove());
  console.log(JSON.stringify({ speedChecks: { options: 6, customStart: 3, pauseAndSingleStep: true, ...transitions } }));
}
