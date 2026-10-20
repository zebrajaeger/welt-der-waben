import { describe, expect, it } from 'vitest';
import { History, historyCapacity, measure } from '../src/history';
import { resident, testState } from './fixtures';

describe('history measurements', () => {
  it('sums actual energy and counts each resident once during capture and division', () => {
    const prey = { ...resident(1, 0, 0, 3), capturedBy: 3, capturedEnergy: 20 };
    const dividing = resident(2, 1, 0, 7);
    dividing.action = { type: 'divide', startTick: 0, duration: 20, targets: [{ column: 2, row: 0 }, { column: 3, row: 0 }] };
    const state = testState([prey, dividing, resident(3, 4, 0, 5, 'carnivore')]);
    state.grass[0] = 4; state.grass[1] = 8; state.reservations[2] = [2];
    expect(measure(state)).toEqual({ tick: 0, carnivoreCount: 1, herbivoreCount: 2,
      carnivoreEnergy: 5, herbivoreEnergy: 10, grassEnergy: 12 });
  });
  it('reports zero for empty populations and grass', () => {
    expect(Object.values(measure(testState([])))).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it('retains only numeric snapshots of the last 300 seconds including both boundaries', () => {
    const history = new History(), state = testState([resident(1, 0, 0, 5)], 1);
    history.reset(state);
    for (let tick = 1; tick <= historyCapacity + 20; tick++) {
      state.tick = tick; history.record(state);
    }
    state.animals[0].energy = 100; state.grass[0] = 100;
    const values = history.values();
    expect(history.size).toBe(18001);
    expect(values[0].tick).toBe(21);
    expect(values.at(-1)?.tick).toBe(18021);
    expect(history.latest).toEqual(values.at(-1));
    expect(values.every(value => Object.values(value).every(number => typeof number === 'number'))).toBe(true);
    expect(history.latest?.herbivoreEnergy).toBe(5);
    expect(history.latest?.grassEnergy).toBe(20);
    state.tick = 0; history.reset(state);
    expect(history.size).toBe(1); expect(history.latest?.tick).toBe(0);
    expect(history.values()[0].herbivoreEnergy).toBe(100);
  });
});
