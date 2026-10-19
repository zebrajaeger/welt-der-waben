import { strict as assert } from 'node:assert';

/** Deterministic browser fixtures use the production transition, playback and renderer. */
export async function checkPredation(page) {
  const result = await page.evaluate(async () => {
    const { defaultConfig } = await import('/src/config.ts');
    const { transition } = await import('/src/simulation.ts');
    const { planAnimation, sampleAnimation } = await import('/src/animation.ts');
    const { Playback } = await import('/src/playback.ts');
    const { render, layout } = await import('/src/render.ts');
    const config = { ...defaultConfig, width: 3, height: 1,
      herbivore: { ...defaultConfig.herbivore, initialCount: 0 }, carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
    const resident = (id, column, species, energy = 5) => ({ id, column, row: 0, species, energy, activeFrom: 1 });
    const initial = { step: 0, nextId: 100, grass: [0, 9, 0],
      animals: [resident(1, 0, 'herbivore'), resident(2, 2, 'carnivore')] };
    const host = document.createElement('section'); host.id = 'predation-check';
    host.style.cssText = 'background:#101c1b;padding:16px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px';
    document.body.append(host);
    const pictures = [];
    function picture(title, frame, fieldConfig = config) {
      const box = document.createElement('div'), label = document.createElement('p'), canvas = document.createElement('canvas');
      label.textContent = `${title} · ${frame.state.animals.map(a => `${a.species === 'herbivore' ? 'G' : 'K'}${a.id}: ${a.energy.toFixed(2)}`).join(' · ')}`;
      label.style.fontSize = '12px'; canvas.style.width = '100%'; box.append(label, canvas); host.append(box);
      pictures.push({ canvas, frame, fieldConfig });
    }
    const plan = planAnimation(transition(initial, config, () => 0));
    for (const [time, label] of [[0.199, 'Vor Graskontakt'], [0.2, 'Spitze im Graszentrum'],
      [0.25, 'Gras halb ausgesaugt'], [0.3, 'Gras vollständig aufgenommen'], [0.4, 'Grasfresser zieht nach']]) {
      picture(label, sampleAnimation(plan, time));
    }
    for (const [time, label] of [[0.499, 'Vor Kontakt'], [0.5, 'Kontakt'], [0.575, 'Halb ausgesaugt'],
      [0.649, 'Fast vollständig ausgesaugt'], [0.65, 'Beute restlos aufgezehrt'], [0.85, 'Nachziehen']]) {
      picture(label, sampleAnimation(plan, time));
    }
    const choices = [0, 0, 0.3, 0, 0, 0];
    const splitConfig = { ...config, height: 2 };
    const split = planAnimation(transition({ ...initial, grass: Array(6).fill(10),
      animals: [resident(1, 0, 'herbivore', 19), resident(2, 1, 'carnivore')] }, splitConfig, () => choices.shift() ?? 0));
    if (!split.hunts.length || !split.divisions.has(split.hunts[0].prey.id)) throw new Error('Fixture must hunt a divided herbivore');
    for (const time of [0.5, 0.575, 0.65]) picture(`Teilungsbeute · t=${time}`, sampleAnimation(split, time), splitConfig);

    const fingerprint = playback => JSON.stringify(playback.frame, (_, value) => value instanceof Map ? [...value] : value);
    let checkedRates = 0;
    for (const rate of [0.25, 8]) {
      const playback = new Playback(initial, { ...config, stepsPerSecond: rate }, () => 0);
      let now = 0.575 * 1000 / rate;
      playback.tick(0); playback.tick(now); playback.toggle(now);
      const frozen = fingerprint(playback);
      playback.setStepsPerSecond(rate === 8 ? 0.25 : 8, now + 100);
      playback.tick(now + 1000);
      if (fingerprint(playback) !== frozen) throw new Error('Paused transfer changed');
      now += 1000; playback.toggle(now);
      if (fingerprint(playback) !== frozen) throw new Error('Resume jumped');
      now += 0.025 * 1000 / playback.stepsPerSecond; playback.tick(now);
      const before = fingerprint(playback);
      playback.setStepsPerSecond(rate, now);
      if (fingerprint(playback) !== before) throw new Error('Running speed change jumped');
      playback.tick(now + 100000);
      if (playback.state.step !== 1 || playback.active) throw new Error('Delayed transfer did not finish exactly once');
      checkedRates++;
    }
    const paused = [0.25, 8].flatMap(rate => [0.25, 0.575].map(phase => {
      const playback = new Playback(initial, { ...config, stepsPerSecond: rate }, () => 0);
      const now = phase * 1000 / rate;
      playback.tick(0); playback.tick(now); playback.toggle(now);
      picture(`Pause · ${phase === 0.25 ? 'Gras' : 'Beute'} · ${rate} Schritte/s`, playback.frame);
      const frozen = fingerprint(playback);
      playback.setStepsPerSecond(rate === 8 ? 0.25 : 8, now + 100);
      if (fingerprint(playback) !== frozen) throw new Error('Paused grass or prey transfer jumped');
      return { playback, frozen };
    }));
    function redraw() {
      for (const { canvas, frame, fieldConfig } of pictures) {
        const width = Math.floor(canvas.parentElement.clientWidth), field = layout(fieldConfig, width, 180);
        canvas.width = width; canvas.height = Math.ceil(field.height);
        render(canvas.getContext('2d'), frame.state, fieldConfig, field, frame.shapes);
      }
    }
    const observer = new ResizeObserver(redraw); observer.observe(host); redraw();
    host.check = () => {
      for (const { playback, frozen } of paused) {
        playback.tick(100000);
        if (fingerprint(playback) !== frozen) throw new Error('Resize changed paused transfer');
      }
      redraw(); return { progress: paused.map(({ playback }) => playback.progress) };
    };
    host.cleanup = () => observer.disconnect();
    const mid = sampleAnimation(plan, 0.575), contact = sampleAnimation(plan, 0.5), end = sampleAnimation(plan, 0.65);
    const grassMid = sampleAnimation(plan, 0.25), grassContact = sampleAnimation(plan, 0.2);
    return { checkedRates, preyAtContact: contact.shapes.has(1), preyAtEnd: end.shapes.has(1),
      grassHalf: grassMid.state.grass[1], grassEnergyHalf: grassMid.state.animals.find(a => a.id === 1).energy,
      grassTipsHeld: JSON.stringify(grassMid.shapes.get(1)) === JSON.stringify(grassContact.shapes.get(1)),
      preyHalfEnergy: mid.state.animals.find(a => a.id === 1).energy,
      hunterHalfEnergy: mid.state.animals.find(a => a.id === 2).energy,
      tipsHeld: JSON.stringify(mid.shapes.get(2)) === JSON.stringify(contact.shapes.get(2)) };
  });
  assert.equal(result.checkedRates, 2); assert.equal(result.preyAtContact, true); assert.equal(result.preyAtEnd, false);
  assert(Math.abs(result.grassHalf - 5) < 1e-9); assert(Math.abs(result.grassEnergyHalf - 10) < 1e-9);
  assert.equal(result.grassTipsHeld, true);
  assert(Math.abs(result.preyHalfEnergy - 6.5) < 1e-9);
  assert(Math.abs(result.hunterHalfEnergy - 8.25) < 1e-9); assert.equal(result.tipsHeld, true);
  await page.locator('#predation-check').screenshot({ path: '.browser-check/predation-phases.png' });
  await page.setViewportSize({ width: 360, height: 740 });
  const resized = await page.locator('#predation-check').evaluate(host => host.check());
  assert.equal(resized.progress.length, 4);
  assert(resized.progress.every((progress, i) => Math.abs(progress - (i % 2 ? 0.575 : 0.25)) < 1e-9));
  await page.locator('#predation-check').screenshot({ path: '.browser-check/predation-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#predation-check').evaluate(host => { host.check(); host.cleanup(); host.remove(); });
  console.log(JSON.stringify({ predationChecks: result }));
}
