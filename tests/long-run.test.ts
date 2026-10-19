import { expect, it } from 'vitest';
import { defaultConfig } from '../src/config';
import { initialize, tick, assertWorld } from '../src/simulation';
import { Playback } from '../src/playback';
import { seededRandom } from './fixtures';

it.each([
  { name: 'standard', config: defaultConfig, seed: 17 },
  { name: 'dense', config: { ...defaultConfig,
    herbivore: { ...defaultConfig.herbivore, initialCount: 100 },
    carnivore: { ...defaultConfig.carnivore, initialCount: 80 } }, seed: 29 },
])('preserves invariants and replay across 36,000 ticks ($name)', async ({ name, config, seed }) => {
  const initial = initialize(config, seededRandom(seed));
  const random = seededRandom(seed + 1);
  let world = initial, maxPopulation = initial.animals.length, maxReservations = 0;
  const start = performance.now();
  for (let i = 0; i < 36000; i++) {
    world = tick(world, config, random); assertWorld(world, config);
    maxPopulation = Math.max(maxPopulation, world.animals.length);
    maxReservations = Math.max(maxReservations, Object.keys(world.reservations).length);
    if (i % 600 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  const coreMs = performance.now() - start;
  const first = new Playback(initial, { ...config, speedMultiplier: 1 }, seededRandom(seed + 1));
  const second = new Playback(initial, { ...config, speedMultiplier: 8 }, seededRandom(seed + 1));
  first.tick(0); second.tick(0);
  for (let i = 1; i <= 12000; i++) {
    first.tick(i * 50);
    if (i % 200 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  for (let i = 1; i <= 4500; i++) {
    second.tick(i * 1000 / 60);
    if (i % 75 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  expect(first.state.tick).toBe(36000); expect(second.state.tick).toBe(36000);
  expect(first.state).toEqual(world); expect(second.state).toEqual(world);
  console.log(JSON.stringify({ name, ticks: world.tick, coreMs, meanTickMs: coreMs / 36000, maxPopulation, maxReservations }));
}, 120000);
