import { describe, expect, it } from 'vitest';
import { ticksPerSecond, defaultConfig } from '../src/config';
import { initialize, tick, assertWorld } from '../src/simulation';
import { advance, fastConfig, resident, seededRandom, testConfig, testState } from './fixtures';



describe('fixed tick clock', () => {
  it.each(['approach', 'transfer', 'follow', 'divide'])('removes death during %s and frees all owned cells', phase => {
    let state = testState([resident(1, 0, 0, phase === 'divide' ? 19 : 5)], 0, fastConfig);
    state.grass[1] = 4;
    for (let i = 0; i < 30; i++) {
      state = tick(state, fastConfig);
      const a = state.animals[0].action;
      if (a && (a.type === 'divide' ? phase === 'divide' : a.phase === phase)) break;
    }
    const action = state.animals[0].action;
    expect(action && (action.type === 'divide' ? action.type : action.phase)).toBe(phase);
    state.animals[0].energy = 1e-12;
    const result = tick(state, fastConfig);
    expect(result.animals).toEqual([]); expect(result.reservations).toEqual({});
  });
  it.each([60, 600])('grows and drains over exactly %s ticks independently of readiness', count => {
    const config = { ...testConfig, grassMax: 100, width: 2, height: 1 };
    const animal = { ...resident(1, 0, 0, 30, 'carnivore'), readyAt: 100000 };
    config.carnivore = { ...config.carnivore, maxEnergy: 40 };
    const initial = testState([animal], 0, config), before = structuredClone(initial);
    const result = advance(initial, config, count);
    expect(result.tick).toBe(count);
    expect(result.grass[1]).toBeCloseTo(count / ticksPerSecond, 9);
    expect(result.animals[0].energy).toBeCloseTo(30 - count / ticksPerSecond * 2, 9);
    expect(initial).toEqual(before);
  });
  it('caps growth, keeps initial distribution unique and staggers readiness', () => {
    const world = initialize(defaultConfig, seededRandom());
    expect(world.animals).toHaveLength(20);
    expect(new Set(world.animals.map(a => a.row * 30 + a.column)).size).toBe(20);
    expect(new Set(world.animals.map(a => a.readyAt)).size).toBeGreaterThan(1);
    expect(world.animals.every(a => a.energy === 10 && a.readyAt < defaultConfig.waitTicks)).toBe(true);
    for (const a of world.animals.filter(a => a.species === 'herbivore')) expect(world.grass[a.row * 30 + a.column]).toBe(0);
    const state = testState([], 10);
    expect(tick(state, testConfig).grass.every(g => g === 10)).toBe(true);
  });
  it('removes a starving actor and all of its reservations without mutating input', () => {
    const config = fastConfig;
    const state = tick(testState([resident(1, 0, 0, 0.01)], 0, config), config);
    state.animals[0].energy = 1e-12;
    const original = structuredClone(state), next = tick(state, config);
    expect(next.animals).toEqual([]); expect(next.reservations).toEqual({});
    expect(state).toEqual(original);
  });
  it('replays the same seed and tick count exactly', () => {
    const first = seededRandom(18), second = seededRandom(18);
    let a = initialize(testConfig, first), b = initialize(testConfig, second);
    for (let i = 0; i < 600; i++) { a = tick(a, testConfig, first); b = tick(b, testConfig, second); }
    expect(a).toEqual(b);
  });
});

describe('local movement and reservations', () => {
  it('chooses the most grass even next to a predator and keeps source occupied until arrival', () => {
    const state = testState([resident(1, 0, 0), { ...resident(2, 2, 0, 5, 'carnivore'), readyAt: 1000 }], 0, fastConfig);
    state.grass[1] = 8;
    const next = tick(state, fastConfig, () => 0);
    expect(next.animals[0].action).toMatchObject({ type: 'travel', to: { column: 1, row: 0 } });
    expect(next.animals[0].column).toBe(0);
    expect(next.reservations[1]).toEqual([1]);
    expect(state.reservations).toEqual({});
  });
  it.each([0, 0.99])('resolves equal targets with an injected random choice %s', choice => {
    const state = testState([resident(1, 0, 0), resident(2, 2, 0)], 0, fastConfig);
    state.grass[1] = 10;
    const next = tick(state, fastConfig, () => choice);
    expect(Object.values(next.reservations)).toHaveLength(1);
    expect(next.animals.filter(a => a.action)).toHaveLength(1);
    expect(next.reservations[1]).toEqual([choice === 0 ? 2 : 1]);
    assertWorld(next, fastConfig);
  });
  it('keeps an unrelated actor progressing while another takes a long meal', () => {
    const config = { ...fastConfig, energyTransferPerSecond: 2, width: 7 };
    const state = testState([resident(1, 0, 0), { ...resident(2, 5, 0), readyAt: 15 }], 0, config);
    state.grass[1] = 10;
    const next = advance(state, config, 30);
    expect(next.animals[0].action).toMatchObject({ phase: 'transfer' });
    expect(next.animals[1].column).not.toBe(5);
    assertWorld(next, config);
  });
  it('makes vacated origins available from the next tick only', () => {
    const config = { ...fastConfig, width: 3 };
    let state = testState([resident(1, 1, 0), { ...resident(2, 0, 0), readyAt: 1000 }], 0, config);
    state = tick(state, config, () => 0.99);
    while (state.animals[0].action) state = tick(state, config, () => 0.99);
    expect(state.animals[0].column).toBe(2);
    expect(state.released[1]).toBe(state.tick);
    state.animals[1].readyAt = state.tick;
    const next = tick(state, config, () => 0);
    expect(next.animals[1].action).toMatchObject({ to: { column: 1, row: 0 } });
  });
});

describe('local division', () => {
  it('lets one half finish and become ready while the other is still eating', () => {
    const config = { ...fastConfig, width: 3 };
    let state = testState([resident(1, 1, 0, 19)], 0, config);
    state.grass[2] = 10;
    state = advance(state, config, 14);
    expect(state.animals).toHaveLength(2);
    expect(state.animals[0].action).toMatchObject({ phase: 'transfer' });
    expect(state.animals[1].readyAt).toBeGreaterThan(12);
    assertWorld(state, config);
  });
  it.each([1, 2, 3])('divides atomically with field width %s', width => {
    const config = { ...fastConfig, width };
    const origin = width === 3 ? 1 : 0;
    const state = testState([resident(1, origin, 0, 19, 'carnivore')], 0, config);
    const started = tick(state, config, () => 0);
    if (width === 1) {
      expect(started.animals).toHaveLength(1); expect(started.animals[0].action).toBeUndefined(); return;
    }
    expect(started.animals[0].action?.type).toBe('divide');
    const born = advance(started, config, config.swellTicks);
    expect(born.animals).toHaveLength(2);
    expect(born.animals[0].energy).toBeCloseTo(born.animals[1].energy, 12);
    expect(new Set(born.animals.map(a => a.column)).size).toBe(2);
    expect(born.animals.some(a => a.column === origin)).toBe(width === 2);
    assertWorld(born, config);
    const settled = advance(born, config, 4);
    assertWorld(settled, config);
  });
  it('allows only one competing division to claim the shared cell, without halving the loser', () => {
    const config = { ...fastConfig, width: 3 };
    const state = testState([resident(1, 0, 0, 19, 'carnivore'), resident(2, 2, 0, 19, 'carnivore')], 0, config);
    const result = advance(state, config, 3);
    expect(result.animals).toHaveLength(3);
    expect(result.animals.filter(a => a.energy > 18)).toHaveLength(1);
    assertWorld(result, config);
  });
  it('cleans a division that dies before giving birth', () => {
    let state = tick(testState([resident(1, 0, 0, 19)], 0, fastConfig), fastConfig);
    state.animals[0].energy = 1e-12;
    state = tick(state, fastConfig);
    expect(state.animals).toHaveLength(0); expect(state.reservations).toEqual({});
  });
});
