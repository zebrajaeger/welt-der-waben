import { describe, expect, it } from 'vitest';
import { defaultConfig, type Config } from '../src/config';
import { cellIndex } from '../src/hex';
import { growGrass, initialize, moveHerbivores, feedHerbivores, divide, hunt, carnivorePhase, step, transition, type State, type Animal, type SimulationEvent } from '../src/simulation';

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

describe('recorded transitions', () => {
  it('matches step and consumes exactly the same random sequence without mutating inputs', () => {
    let state = initialize(defaultConfig, seeded());
    for (let i = 0; i < 100; i++) {
      let plainDraws = 0, recordedDraws = 0;
      const plainRandom = seeded(i), recordedRandom = seeded(i);
      const original = structuredClone(state);
      const plain = step(state, defaultConfig, () => { plainDraws++; return plainRandom(); });
      const recorded = transition(state, defaultConfig, () => { recordedDraws++; return recordedRandom(); });
      expect(recorded.after).toEqual(plain);
      expect(recordedDraws).toBe(plainDraws);
      expect(state).toEqual(original);
      expect(recorded.before).toEqual(original);
      state = plain;
    }
  });
  it('retains a moved and consumed prey and the exact hunter before and after feeding', () => {
    const state = stateWith([animal(1, 0, 0, 5), animal(2, 2, 0, 5, 'carnivore')]);
    state.grass[1] = 9;
    const result = transition(state, config, () => 0);
    expect(result.events).toEqual([
      { type: 'move', animal: animal(1, 0, 0, 5), to: { column: 1, row: 0 } },
      { type: 'hunt', animal: animal(2, 2, 0, 5, 'carnivore'), prey: animal(1, 1, 0, 13), energyAfter: 11.5 },
    ]);
    expect(result.grown.grass[1]).toBe(10);
    expect(result.herbivores.animals[0]).toEqual(animal(1, 1, 0, 13));
    expect(result.hunted.animals).toEqual([animal(2, 1, 0, 11.5, 'carnivore')]);
    expect(result.after.animals).toEqual([animal(2, 1, 0, 9.5, 'carnivore')]);
    result.after.animals[0].energy = 1;
    expect(result.hunted.animals[0].energy).toBe(11.5);
    expect(result.events[1]).toMatchObject({ animal: { energy: 5 }, prey: { energy: 13 } });
  });
  it('records a birth before a hunt of that newborn, with no newborn movement', () => {
    const state = stateWith([animal(1, 0, 0, 19), animal(2, 1, 0, 5, 'carnivore')], 10);
    const choices = [0, 0, 0.3, 0, 0, 0];
    const result = transition(state, config, () => choices.shift() ?? 0);
    expect(result.events.map(e => e.type)).toEqual(['move', 'birth', 'hunt']);
    expect(result.events[1]).toMatchObject({ type: 'birth', parentId: 1, animal: { id: 100, column: 0, row: 0, activeFrom: 3 } });
    expect(result.events[2]).toMatchObject({ type: 'hunt', animal: { id: 2 }, prey: { id: 100, column: 0, row: 0 } });
  });
  it('records only the winning hunter of stationary prey and a subsequent birth at the vacated cell', () => {
    const cfg = { ...config, width: 3, height: 1 };
    const state = { ...stateWith([animal(1, 0, 0, 18, 'carnivore'), animal(2, 2, 0, 5, 'carnivore'), animal(3, 1, 0)]), grass: [0, 0, 0] };
    const result = transition(state, cfg, () => 0);
    expect(result.events.map(e => e.type)).toEqual(['hunt', 'birth']);
    expect(result.events[0]).toMatchObject({ type: 'hunt', animal: { id: 1, column: 0 }, prey: { id: 3, column: 1 } });
    expect(result.events[1]).toMatchObject({ type: 'birth', parentId: 1, animal: { column: 0, row: 0 } });
    expect(result.after.animals.find(a => a.id === 2)?.column).toBe(2);
  });
  it('records death after movement and carnivore death after the hunt phase', () => {
    const result = transition(stateWith([animal(1, 0, 0, 1), animal(2, 4, 3, 1, 'carnivore')]), config, () => 0);
    expect(result.events.map(e => e.type)).toEqual(['move', 'death', 'death']);
    expect(result.events[1]).toMatchObject({ animal: { id: 1, column: 1, row: 0, energy: 0 } });
    expect(result.events[2]).toMatchObject({ animal: { id: 2, energy: -1 } });
    expect(result.after.animals).toHaveLength(0);
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
  it('herbivore halves eat the grass in newly entered division cells immediately', () => {
    const cfg = { ...config, width: 3, height: 1 };
    const state = { ...stateWith([animal(1, 0, 0, 19)]), grass: [10, 10, 10] };
    const recorded = transition(state, cfg, () => 0);
    expect(recorded.after.animals.map(a => a.column)).toEqual([2, 0]);
    expect(recorded.after.grass).toEqual([0, 0, 0]);
    expect(recorded.after.animals.map(a => a.energy)).toEqual([19, 19]);
    expect(recorded.after.nextId).toBe(101);
  });
  it('only feeds the departing half when one division cell is free and applies efficiency and caps', () => {
    const cfg = { ...config, width: 2, height: 1, grassEfficiency: 0.5 };
    const state = { ...stateWith([animal(1, 0, 0, 19)]), grass: [10, 10] };
    const recorded = transition(state, cfg, () => 0);
    expect(recorded.after.grass).toEqual([0, 0]);
    expect(recorded.after.animals.map(a => a.energy)).toEqual([9, 14]);
    expect(recorded.after.animals).toHaveLength(2);
    const capConfig = { ...config, width: 3, height: 1, grassMax: 30, grassGrowth: 0 };
    const full = transition({ ...state, grass: [30, 0, 30] }, capConfig, () => 0);
    expect(full.after.grass).toEqual([0, 0, 0]);
    expect(full.after.animals.map(a => a.energy)).toEqual([20, 20]);
    expect(full.after.animals).toHaveLength(2);
  });
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
  it('uses one free cell with a stationary half, but moves both halves if two are available', () => {
    for (const width of [1, 2, 3]) {
      const cfg = { ...config, width, height: 1 };
      const parent = animal(1, width === 3 ? 1 : 0, 0, 18, species);
      const state = { ...stateWith([parent]), grass: Array(width).fill(7) };
      const events: SimulationEvent[] = [];
      divide(state, cfg, species, () => 0, event => events.push(event));
      expect(state.animals).toHaveLength(width === 1 ? 1 : 2);
      if (width === 1) {
        expect(parent.energy).toBe(18); expect(events).toHaveLength(0);
      } else {
        expect(state.animals.map(a => a.energy)).toEqual(species === 'herbivore' ? [width === 2 ? 9 : 16, 16] : [9, 9]);
        expect(parent.column).toBe(width === 2 ? 0 : 2);
        expect(state.animals[1].column).toBe(width === 2 ? 1 : 0);
        expect(events[0]).toMatchObject({ type: 'birth', parentBefore: { column: width === 3 ? 1 : 0, energy: 18 }, parentAfter: { column: width === 3 ? 2 : 0, energy: 9 } });
        if (width === 3) expect(state.animals.some(a => a.column === 1)).toBe(false);
      }
      expect(state.grass).toEqual(species === 'herbivore' && width > 1 ? width === 2 ? [7, 0] : [0, 7, 0] : Array(width).fill(7));
    }
  });
  it('resolves two-target conflicts atomically and does not halve the losing parent', () => {
    for (const value of [0, 0.999]) {
      const cfg = { ...config, width: 5, height: 1 };
      const state = { ...stateWith([animal(1, 1, 0, 18, species), animal(2, 3, 0, 18, species)]), grass: Array(5).fill(0) };
      divide(state, cfg, species, () => value);
      expect(state.animals).toHaveLength(3);
      expect(state.animals.filter(a => a.energy === 9)).toHaveLength(2);
      expect(state.animals.filter(a => a.energy === 18)).toHaveLength(1);
      expect(new Set(state.animals.map(a => a.column)).size).toBe(3);
      expect(state.animals.find(a => a.energy === 18)?.id).toBe(value === 0 ? 2 : 1);
    }
  });
  it('uses a strict threshold and shares energy only for a successful birth', () => {
    const state = stateWith([animal(1, 0, 0, 15, species)]);
    divide(state, config, species, () => 0);
    expect(state.animals).toHaveLength(1);
    state.animals[0].energy = 18;
    state.grass[1] = 8;
    divide(state, config, species, () => 0);
    expect(state.animals.map(a => a.energy)).toEqual(species === 'herbivore' ? [9, 17] : [9, 9]);
    expect(state.animals[1]).toMatchObject({ column: 1, row: 0, activeFrom: 2 });
    expect(state.grass[1]).toBe(species === 'herbivore' ? 0 : 8);
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
      animal(1, 2, 0, 9, 'carnivore'),
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
    expect(next.animals.find(a => a.id === 1)?.energy).toBe(19);
    expect(next.animals.find(a => a.id === 2)?.energy).toBe(12.5);
    expect(next.grass[0]).toBe(0);
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
