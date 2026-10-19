import { describe, expect, it, vi } from 'vitest';
import { Playback } from '../src/playback';
import { initialize, step, transition } from '../src/simulation';
import { defaultConfig } from '../src/config';
import { movingPrey, resident, seededRandom, testConfig, testState } from './fixtures';

describe('animation playback', () => {
  it('freezes both separating halves and resumes the division without an extra step', () => {
    const playback = new Playback(testState([resident(1, 0, 0, 19)], 10), testConfig, () => 0);
    playback.tick(0); playback.tick(200); playback.toggle(200);
    const frame = playback.frame;
    expect(frame.shapes.has(100)).toBe(true);
    playback.tick(10000);
    expect(playback.frame).toEqual(frame);
    playback.toggle(11000);
    expect(playback.frame).toEqual(frame);
    playback.tick(11300);
    expect(playback.state.step).toBe(1);
    expect(playback.state.animals).toHaveLength(2);
  });
  it.each([1, 20])('scales the entire timeline at %s steps per second without changing rules', stepsPerSecond => {
    const config = { ...testConfig, stepsPerSecond }, state = movingPrey();
    const compute = vi.fn(state => transition(state, config, seededRandom()));
    const playback = new Playback(state, config, undefined, compute);
    playback.tick(0);
    const interval = 1000 / stepsPerSecond;
    playback.tick(interval / 2);
    expect(playback.progress).toBeCloseTo(0.5);
    expect(playback.state.step).toBe(0);
    expect(playback.frame.state.animals.some(a => a.id === 1)).toBe(true);
    playback.tick(interval);
    expect(playback.active).toBe(false);
    expect(playback.state).toEqual(step(state, config, seededRandom()));
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('freezes an in-progress shape and resumes from the same timestamp offset', () => {
    const playback = new Playback(movingPrey(), testConfig, () => 0);
    playback.tick(0); playback.tick(75); playback.toggle(100);
    const paused = playback.frame;
    expect(playback.progress).toBeCloseTo(0.2);
    expect(playback.canSingleStep).toBe(false);
    playback.tick(10000);
    expect(playback.frame).toEqual(paused);
    playback.toggle(20000);
    expect(playback.frame).toEqual(paused);
    playback.tick(20050);
    expect(playback.progress).toBeCloseTo(0.3);
    playback.tick(20400);
    expect(playback.state.step).toBe(1);
  });
  it('runs exactly one animated single step, rejects repeats, and can pause that step', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.toggle(0);
    // The initial toggle freezes an already prepared first transition. Reset starts an idle pause.
    playback.reset(movingPrey(), 0);
    expect(playback.canSingleStep).toBe(true);
    expect(playback.singleStep(10)).toBe(true);
    expect(playback.singleStep(20)).toBe(false);
    playback.tick(110);
    playback.toggle(110);
    const frozen = playback.frame;
    playback.tick(5000);
    expect(playback.frame).toEqual(frozen);
    playback.toggle(6000);
    playback.tick(6400);
    expect(playback.state.step).toBe(1);
    expect(playback.running).toBe(false);
    expect(playback.canSingleStep).toBe(true);
    playback.tick(10000);
    expect(playback.state.step).toBe(1);
    expect(compute).toHaveBeenCalledTimes(2); // one cancelled initial transition, one completed
  });
  it('discards an old transition and orientations on reset without later applying its events', () => {
    const playback = new Playback(movingPrey(), testConfig, () => 0);
    playback.tick(0); playback.tick(200); playback.toggle(200);
    const replacement = movingPrey(); replacement.animals[0].id = 99;
    playback.reset(replacement, 300);
    expect(playback.active).toBe(false);
    expect(playback.frame.state).toEqual(replacement);
    playback.tick(10000);
    expect(playback.state).toEqual(replacement);
    expect(playback.frame.shapes.has(99)).toBe(true);
    expect(playback.frame.shapes.has(1)).toBe(false);
  });
  it('closes only one transition after a delayed frame and never builds a catch-up queue', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.tick(0);
    playback.tick(60000);
    expect(playback.state.step).toBe(1);
    expect(playback.active).toBe(false);
    expect(compute).toHaveBeenCalledTimes(1);
    playback.tick(60016);
    expect(playback.progress).toBeCloseTo(16 / 500);
    expect(compute).toHaveBeenCalledTimes(2);
  });
});

describe('runtime speed', () => {
  it('freezes transfer energies and geometry while paused, then changes tempo without a jump', () => {
    const random = vi.fn(() => 0), compute = vi.fn(state => transition(state, testConfig, random));
    const playback = new Playback(movingPrey(), testConfig, random, compute);
    playback.tick(0); playback.tick(287.5); playback.toggle(287.5);
    expect(playback.progress).toBeCloseTo(0.575);
    expect(playback.frame.state.animals.find(a => a.id === 1)?.energy).toBeCloseTo(6.5);
    const frozen = playback.frame, draws = random.mock.calls.length;
    playback.setStepsPerSecond(0.25, 10000); playback.tick(20000);
    expect(playback.frame).toEqual(frozen);
    playback.toggle(20000);
    playback.tick(20100);
    expect(playback.progress).toBeCloseTo(0.6);
    const before = playback.frame;
    playback.setStepsPerSecond(8, 20100);
    expect(playback.frame).toEqual(before);
    playback.tick(20106.25);
    expect(playback.progress).toBeCloseTo(0.65);
    expect(playback.frame.shapes.has(1)).toBe(false);
    playback.tick(20150);
    expect(playback.state).toEqual(step(movingPrey(), testConfig, () => 0));
    expect(compute).toHaveBeenCalledTimes(1);
    expect(random).toHaveBeenCalledTimes(draws);
  });
  it('finishes a single step once when a delayed frame skips the rest of transfer and follow-through', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.toggle(0); playback.reset(movingPrey(), 0); compute.mockClear();
    playback.singleStep(0); playback.tick(275);
    expect(playback.frame.shapes.has(1)).toBe(true);
    playback.setStepsPerSecond(8, 275);
    playback.tick(60000); playback.tick(90000);
    expect(playback.running).toBe(false);
    expect(playback.canSingleStep).toBe(true);
    expect(playback.state).toEqual(step(movingPrey(), testConfig, () => 0));
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('discards every visible transfer residue on reset', () => {
    const playback = new Playback(movingPrey(), testConfig, () => 0);
    playback.tick(0); playback.tick(287.5); playback.toggle(287.5);
    expect(playback.frame.shapes.has(1)).toBe(true);
    const replacement = testState([resident(99, 4, 3)]);
    playback.reset(replacement, 300); playback.tick(10000);
    expect(playback.frame.state).toEqual(replacement);
    expect([...playback.frame.shapes.keys()]).toEqual([99]);
    expect(playback.progress).toBe(0);
  });
  it('settles time at the old speed and changes only future progress', () => {
    const config = Object.freeze({ ...testConfig });
    const compute = vi.fn(state => transition(state, config, () => 0));
    const playback = new Playback(movingPrey(), config, undefined, compute);
    const reference = new Playback(movingPrey(), config, () => 0);
    playback.tick(0); playback.tick(50);
    reference.tick(0); reference.tick(100);
    playback.setStepsPerSecond(4, 100);
    expect(playback.progress).toBeCloseTo(0.2);
    expect(playback.frame).toEqual(reference.frame);
    playback.tick(150);
    expect(playback.progress).toBeCloseTo(0.4);
    playback.setStepsPerSecond(0.5, 200);
    expect(playback.progress).toBeCloseTo(0.6);
    playback.tick(1000);
    expect(playback.state.step).toBe(1);
    expect(playback.stepsPerSecond).toBe(0.5);
    expect(config.stepsPerSecond).toBe(2);
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('does not prepare a step merely because the speed is selected', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.setStepsPerSecond(8, 0);
    playback.setStepsPerSecond(0.25, 100);
    expect(playback.active).toBe(false);
    expect(playback.state.step).toBe(0);
    expect(compute).not.toHaveBeenCalled();
    playback.tick(100);
    expect(playback.progress).toBe(0);
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('rejects invalid speeds before settling time or changing any state', () => {
    const playback = new Playback(movingPrey(), testConfig, () => 0);
    playback.tick(0); playback.tick(100);
    const before = playback.frame;
    for (const value of [0, -1, NaN, Infinity, -Infinity]) {
      expect(() => playback.setStepsPerSecond(value, 10000)).toThrow(/Tempo/);
      expect(playback.frame).toEqual(before);
      expect(playback.progress).toBeCloseTo(0.2);
      expect(playback.stepsPerSecond).toBe(2);
    }
    playback.tick(200);
    expect(playback.progress).toBeCloseTo(0.4);
  });
  it('closes a due transition at a speed-change boundary without starting another', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.tick(0);
    playback.setStepsPerSecond(8, 500);
    expect(playback.state.step).toBe(1);
    expect(playback.active).toBe(false);
    expect(compute).toHaveBeenCalledTimes(1);
    playback.tick(500);
    expect(playback.progress).toBe(0);
    expect(compute).toHaveBeenCalledTimes(2);
    playback.tick(60000);
    expect(playback.state.step).toBe(2);
    expect(playback.active).toBe(false);
    expect(compute).toHaveBeenCalledTimes(2);
  });
  it('preserves a paused division when changing speed and resumes at the new rate', () => {
    const playback = new Playback(testState([resident(1, 0, 0, 19)], 10), testConfig, () => 0);
    playback.tick(0); playback.tick(200); playback.toggle(200);
    const paused = playback.frame;
    playback.setStepsPerSecond(8, 10000);
    expect(playback.running).toBe(false);
    expect(playback.frame).toEqual(paused);
    playback.toggle(11000);
    expect(playback.frame).toEqual(paused);
    playback.tick(11012.5);
    expect(playback.progress).toBeCloseTo(0.5);
    playback.tick(11075);
    expect(playback.state.step).toBe(1);
  });
  it('keeps single-step mode through multiple speed changes and pauses once at completion', () => {
    const compute = vi.fn(state => transition(state, testConfig, () => 0));
    const playback = new Playback(movingPrey(), testConfig, undefined, compute);
    playback.toggle(0); playback.reset(movingPrey(), 0); compute.mockClear();
    playback.singleStep(0);
    playback.setStepsPerSecond(0.25, 100);
    expect(playback.progress).toBeCloseTo(0.2);
    playback.tick(1100);
    expect(playback.progress).toBeCloseTo(0.45);
    playback.setStepsPerSecond(8, 1100);
    playback.tick(1168.75);
    expect(playback.running).toBe(false);
    expect(playback.canSingleStep).toBe(true);
    expect(playback.state.step).toBe(1);
    playback.tick(10000);
    expect(compute).toHaveBeenCalledTimes(1);
  });
  it('retains the chosen speed on reset and uses the configured speed for a new instance', () => {
    const playback = new Playback(movingPrey(), testConfig, () => 0);
    playback.setStepsPerSecond(4, 0);
    playback.reset(movingPrey(), 100);
    expect(playback.stepsPerSecond).toBe(4);
    playback.tick(100); playback.tick(350);
    expect(playback.state.step).toBe(1);
    expect(new Playback(movingPrey(), testConfig).stepsPerSecond).toBe(2);
  });
  it('produces the same seeded rule states after each step despite repeated speed changes', () => {
    const initial = initialize(defaultConfig, seededRandom(4));
    const random = seededRandom(9), referenceRandom = seededRandom(9);
    const playback = new Playback(initial, defaultConfig, random);
    let expected = initial, now = 0;
    for (let i = 0; i < 50; i++) {
      const first = i % 2 ? 8 : 0.25, second = i % 2 ? 0.5 : 4;
      playback.setStepsPerSecond(first, now);
      playback.tick(now);
      now += 0.2 * 1000 / first;
      playback.tick(now);
      const before = playback.frame;
      playback.setStepsPerSecond(second, now);
      expect(playback.frame).toEqual(before);
      now += 0.8 * 1000 / second;
      playback.tick(now);
      expected = step(expected, defaultConfig, referenceRandom);
      expect(playback.state).toEqual(expected);
    }
  });
});
