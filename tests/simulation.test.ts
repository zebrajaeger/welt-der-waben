import { describe, expect, it } from 'vitest';
import { defaultConfig, type Config } from '../src/config';
import { cellIndex } from '../src/hex';
import { growGrass, initialize, moveHerbivores, feedHerbivores, divide, hunt, carnivorePhase, step, type State, type Animal } from '../src/simulation';

export function seeded(seed = 37): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
const config: Config = { ...defaultConfig, width: 5, height: 4,
  herbivore: { ...defaultConfig.herbivore, initialCount: 0 },
  carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
const animal = (id: number, column: number, row: number, energy = 10, species: Animal['species'] = 'herbivore'): Animal =>
  ({ id, column, row, energy, species, activeFrom: 1 });
const stateWith = (animals: Animal[], grass = 0): State =>
  ({ step: 1, animals, grass: Array(20).fill(grass), nextId: 100 });

describe('initialization and grass', () => {
  it('initializes separate half-energies, unique positions and cleared grazer cells only', () => {
    const cfg = { ...defaultConfig, carnivore: { ...defaultConfig.carnivore, maxEnergy: 40 } };
    const state = initialize(cfg, seeded());
    expect(state.step).toBe(0);
    expect(new Set(state.animals.map(a => cellIndex(a, cfg.width))).size).toBe(20);
    for (const species of ['herbivore', 'carnivore'] as const) {
      const animals = state.animals.filter(a => a.species === species);
      expect(animals).toHaveLength(10);
      expect(animals.every(a => a.energy === cfg[species].maxEnergy / 2)).toBe(true);
    }
    for (let i = 0; i < state.grass.length; i++) {
      expect(state.grass[i]).toBe(state.animals.some(a => a.species === 'herbivore' && cellIndex(a, cfg.width) === i) ? 0 : 5);
    }
    expect(initialize(cfg, seeded())).toEqual(state);
  });
  it('supports complete occupancy even with repeated random values', () => {
    const state = initialize({ ...config, herbivore: { ...config.herbivore, initialCount: 20 } }, () => 0);
    expect(new Set(state.animals.map(a => cellIndex(a, 5))).size).toBe(20);
  });
  it('grows linearly, caps at maximum and accepts zero growth under animals too', () => {
    const state = stateWith([animal(1, 0, 0, 10, 'carnivore')]);
    state.grass.splice(0, 4, 0, 5, 9.5, 10);
    growGrass(state, config);
    expect(state.grass.slice(0, 4)).toEqual([1, 6, 10, 10]);
    const before = [...state.grass];
    growGrass(state, { ...config, grassGrowth: 0 });
    expect(state.grass).toEqual(before);
  });
});

describe('simultaneous herbivore movement', () => {
  it('chooses the grass maximum even next to a predator and moves only one cell', () => {
    const state = stateWith([animal(1, 0, 0), animal(2, 2, 0, 10, 'carnivore')]);
    state.grass[1] = 9;
    state.grass[3] = 10;
    moveHerbivores(state, config, () => 0);
    expect(state.animals[0]).toMatchObject({ column: 1, row: 0 });
    expect(state.animals[1]).toMatchObject({ column: 2, row: 0 });
  });
  it('never targets occupied cells or cells vacated in the same round', () => {
    const state = stateWith([animal(1, 0, 0), animal(2, 1, 0)]);
    state.grass[0] = 10; state.grass[1] = 10; state.grass[2] = 9;
    moveHerbivores(state, config, () => 0);
    expect(state.animals[0]).toMatchObject({ column: 0, row: 1 });
    expect(state.animals[1]).toMatchObject({ column: 2, row: 0 });
  });
  it('resolves a shared target randomly and leaves the loser in place', () => {
    for (const random of [() => 0, () => 0.999]) {
      const state = stateWith([animal(1, 0, 0), animal(2, 2, 0)]);
      state.grass[1] = 10;
      moveHerbivores(state, config, random);
      expect(state.animals.filter(a => a.column === 1 && a.row === 0)).toHaveLength(1);
      expect(state.animals[random() === 0 ? 1 : 0].column).toBe(random() === 0 ? 2 : 0);
    }
  });
  it('breaks grass ties with the injected random source', () => {
    const a = stateWith([animal(1, 2, 2)], 3);
    const b = structuredClone(a);
    moveHerbivores(a, config, () => 0);
    moveHerbivores(b, config, () => 0.999);
    expect(a.animals[0]).not.toEqual(b.animals[0]);
  });
});

describe('feeding and energy', () => {
  it('clears grass, applies efficiency, caps before drain, and removes starved animals', () => {
    const state = stateWith([animal(1, 0, 0, 19), animal(2, 1, 0, 2), animal(3, 2, 0, 5)]);
    state.grass[0] = 10; state.grass[2] = 3;
    feedHerbivores(state, { ...config, grassEfficiency: 0.5 });
    expect(state.animals.map(a => [a.id, a.energy])).toEqual([[1, 18], [3, 4.5]]);
    expect(state.grass.slice(0, 3)).toEqual([0, 0, 0]);
  });
  it('trapped herbivores eat their own regrowth and eventually die', () => {
    const cfg = { ...config, width: 1, height: 1 };
    let state = initialize(cfg);
    state.animals = [animal(1, 0, 0)]; state.grass[0] = 0;
    for (let i = 1; i <= 10; i++) {
      state = step(state, cfg, () => 0);
      expect(state.animals[0]?.energy ?? 0).toBe(10 - i);
    }
    expect(state.animals).toHaveLength(0);
  });
  it('a movement loser eats its starting cell', () => {
    const state = stateWith([animal(1, 0, 0), animal(2, 2, 0)]);
    state.grass[1] = 9; state.grass[2] = 4;
    moveHerbivores(state, config, () => 0);
    feedHerbivores(state, config);
    expect(state.animals[1].energy).toBe(12);
    expect(state.grass[2]).toBe(0);
  });
});

describe.each(['herbivore', 'carnivore'] as const)('%s division', species => {
  it('uses a strict threshold and shares energy only for a successful birth', () => {
    const state = stateWith([animal(1, 0, 0, 15, species)]);
    divide(state, config, species, () => 0);
    expect(state.animals).toHaveLength(1);
    state.animals[0].energy = 18;
    state.grass[1] = 8;
    divide(state, config, species, () => 0);
    expect(state.animals.map(a => a.energy)).toEqual([9, 9]);
    expect(state.animals[1]).toMatchObject({ column: 1, row: 0, activeFrom: 2 });
    expect(state.grass[1]).toBe(8);
  });
  it('resolves birth conflicts without splitting the losing parent', () => {
    const state = stateWith(Array.from({ length: 20 }, (_, i) => animal(i + 1, i % 5, Math.floor(i / 5), 18, species)));
    state.animals = state.animals.filter(a => cellIndex(a, 5) !== 1);
    divide(state, config, species, () => 0);
    expect(state.animals).toHaveLength(20);
    expect(state.animals.filter(a => a.energy === 9)).toHaveLength(2);
    expect(new Set(state.animals.map(a => cellIndex(a, 5))).size).toBe(20);
    expect(state.animals[0].energy).toBe(9);
  });
  it('does not divide without space or cascade through newborns', () => {
    const cfg = { ...config, width: 1, height: 1 };
    const state = stateWith([animal(1, 0, 0, 20, species)]);
    divide(state, cfg, species, () => 0);
    expect(state.animals).toHaveLength(1);
    expect(state.animals[0].energy).toBe(20);
    const lowThreshold = { ...config, [species]: { ...config[species], divisionFraction: 0.1 } };
    divide(state, lowThreshold, species, () => 0);
    expect(state.animals).toHaveLength(2);
    expect(state.animals[1].activeFrom).toBe(2);
  });
});

describe('carnivore phase', () => {
  it('shares a single prey randomly and never retries a lost hunt', () => {
    for (const random of [() => 0, () => 0.999]) {
      const state = stateWith([animal(1, 0, 0, 5, 'carnivore'), animal(2, 2, 0, 5, 'carnivore'), animal(3, 1, 0, 8)]);
      hunt(state, config, random);
      expect(state.animals.map(a => a.energy).sort()).toEqual([5, 9]);
      expect(state.animals[random() === 0 ? 0 : 1].energy).toBe(9);
      expect(state.animals[random() === 0 ? 0 : 1]).toMatchObject({ column: 1, row: 0 });
      expect(state.animals[random() === 0 ? 1 : 0]).toMatchObject({ column: random() === 0 ? 2 : 0, row: 0 });
      expect(new Set(state.animals.map(a => cellIndex(a, 5))).size).toBe(2);
    }
  });
  it('selects at most one among multiple prey and caps energy', () => {
    const state = stateWith([animal(1, 1, 1, 19, 'carnivore'), animal(2, 0, 1, 8), animal(3, 2, 1, 12)]);
    hunt(state, config, () => 0);
    expect(state.animals).toHaveLength(2);
    expect(state.animals[0].energy).toBe(20);
    expect(state.animals.some(a => a.id === 2)).toBe(false);
    expect(state.animals[0]).toMatchObject({ column: 0, row: 1 });
  });
  it('moves onto consumed prey, drains after hunting and removes deaths', () => {
    const state = stateWith([animal(1, 0, 0, 2, 'carnivore'), animal(2, 4, 3, 2, 'carnivore'), animal(3, 1, 0, 8)]);
    carnivorePhase(state, config, () => 0);
    expect(state.animals).toEqual([animal(1, 1, 0, 4, 'carnivore')]);
  });
  it('stays in place without prey and preserves grass on a consumed prey cell', () => {
    const state = stateWith([animal(1, 0, 0, 8, 'carnivore'), animal(2, 4, 3, 8, 'carnivore'), animal(3, 1, 0, 4)], 7);
    hunt(state, config, () => 0);
    expect(state.animals[0]).toMatchObject({ column: 1, row: 0 });
    expect(state.animals[1]).toMatchObject({ column: 4, row: 3 });
    expect(state.grass[1]).toBe(7);
  });
  it('divides around the prey cell after moving and can use its vacated starting cell', () => {
    const state = stateWith([animal(1, 0, 0, 18, 'carnivore'), animal(2, 1, 0, 8)]);
    carnivorePhase(state, config, () => 0);
    expect(state.animals).toEqual([
      animal(1, 1, 0, 9, 'carnivore'),
      { ...animal(100, 0, 0, 9, 'carnivore'), activeFrom: 2 },
    ]);
  });
  it('newborn predators neither hunt nor drain until the following step', () => {
    const state = stateWith([animal(1, 0, 0, 18, 'carnivore'), animal(2, 2, 0, 8)]);
    carnivorePhase(state, config, () => 0);
    expect(state.animals.find(a => a.id === 100)).toMatchObject({ column: 1, energy: 8, activeFrom: 2 });
    expect(state.animals.some(a => a.id === 2)).toBe(true);
    state.step++;
    carnivorePhase(state, config, () => 0);
    expect(state.animals.some(a => a.id === 2)).toBe(false);
  });
});

describe('complete steps', () => {
  it('grows before feeding and allows hunting after movement without mutating input', () => {
    const state = stateWith([animal(1, 0, 0, 5), animal(2, 2, 0, 5, 'carnivore')]);
    state.step = 0; state.grass[1] = 9;
    const original = structuredClone(state);
    const next = step(state, config, () => 0);
    expect(next.animals).toHaveLength(1);
    expect(next.animals[0]).toMatchObject({ id: 2, column: 1, row: 0, energy: 9.5 });
    expect(next.grass[1]).toBe(0);
    expect(next.step).toBe(1);
    expect(state).toEqual(original);
  });
  it('allows immediate hunting of newborn herbivores without newborn feeding', () => {
    const state = stateWith([animal(1, 0, 0, 19), animal(2, 2, 0, 5, 'carnivore')], 10);
    state.step = 0;
    // Move down, then give birth back to the newly vacated cell (0,0).
    state.animals[1].column = 1;
    const choices = [0, 0, 0.3, 0, 0, 0];
    const next = step(state, config, () => choices.shift() ?? 0);
    expect(next.animals.some(a => a.id === 100)).toBe(false);
    expect(next.animals.find(a => a.id === 1)?.energy).toBe(9);
    expect(next.animals.find(a => a.id === 2)?.energy).toBe(7.5);
    expect(next.grass[0]).toBe(10);
  });
  it('keeps positions, identities, grass and energy valid across long seeded runs', () => {
    for (let seed = 0; seed < 10; seed++) {
      const random = seeded(seed);
      let state = initialize(defaultConfig, random);
      for (let i = 0; i < 500; i++) {
        state = step(state, defaultConfig, random);
        expect(new Set(state.animals.map(a => cellIndex(a, 30))).size).toBe(state.animals.length);
        expect(new Set(state.animals.map(a => a.id)).size).toBe(state.animals.length);
        expect(state.animals.every(a => a.energy > 0 && a.energy <= defaultConfig[a.species].maxEnergy && a.column >= 0 && a.column < 30 && a.row >= 0 && a.row < 20)).toBe(true);
        expect(state.grass.every(g => g >= 0 && g <= 10)).toBe(true);
      }
    }
  });
  it('uses identical per-step rules at different playback speeds', () => {
    const state = initialize(defaultConfig, seeded());
    expect(step(state, { ...defaultConfig, stepsPerSecond: 1 }, seeded()))
      .toEqual(step(state, { ...defaultConfig, stepsPerSecond: 20 }, seeded()));
  });
});
