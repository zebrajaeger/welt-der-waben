import { describe, expect, it, vi } from 'vitest';
import { Playback, maxTicksPerFrame, maxPendingTicks } from '../src/playback';
import { initialize, tick } from '../src/simulation';
import { defaultConfig } from '../src/config';
import { History } from '../src/history';
import { advance, fastConfig, resident, seededRandom, testConfig, testState } from './fixtures';

describe('fixed tick playback', () => {
  it('records every completed tick, including ticks settled on speed changes and pause', () => {
    const history = new History(), state = testState([]);
    history.reset(state);
    const playback = new Playback(state, { ...testConfig, speedMultiplier: 1 }, undefined, undefined, state => history.record(state));
    playback.tick(0); playback.tick(100);
    expect(history.values().map(value => value.tick)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    playback.setSpeedMultiplier(2, 200);
    expect(history.latest?.tick).toBe(12);
    playback.toggle(300);
    expect(history.latest?.tick).toBe(24);
    playback.tick(1000); playback.setSpeedMultiplier(8, 2000);
    expect(history.size).toBe(25);
    playback.singleStep(3000);
    expect(history.latest?.tick).toBe(25); expect(history.size).toBe(26);
    expect(playback.running).toBe(false);
  });
  it.each([0.25, 1, 2, 8])('runs 60 ticks per active simulated second at %s×', speedMultiplier => {
    const config = { ...testConfig, speedMultiplier };
    const playback = new Playback(testState([]), config);
    playback.tick(0);
    for (let i = 1; i <= 120; i++) playback.tick(i * 1000 / 120 / speedMultiplier);
    expect(playback.state.tick).toBe(60);
    expect(playback.pendingTicks).toBeCloseTo(0);
  });
  it('retains sub-tick time instead of rounding every frame', () => {
    const playback = new Playback(testState([]), { ...testConfig, speedMultiplier: 1 });
    playback.tick(0); playback.tick(5); playback.tick(10); playback.tick(15);
    expect(playback.state.tick).toBe(0); expect(playback.pendingTicks).toBeCloseTo(0.9);
    playback.tick(1000 / 60); expect(playback.state.tick).toBe(1);
  });
  it('freezes all actors and resource quantities while paused, then resumes without a time jump', () => {
    const playback = new Playback(testState([resident(1, 0, 0)], 10), fastConfig, () => 0);
    playback.tick(0); playback.tick(50); playback.toggle(50);
    const frame = playback.frame;
    playback.tick(50000); playback.setSpeedMultiplier(8, 60000);
    expect(playback.frame).toEqual(frame);
    playback.toggle(100000); expect(playback.frame).toEqual(frame);
    playback.tick(100010); expect(playback.state.tick).toBe(frame.state.tick + 4);
  });
  it('settles the old factor and changes only future elapsed time', () => {
    const playback = new Playback(testState([]), { ...testConfig, speedMultiplier: 1 });
    playback.tick(0); playback.setSpeedMultiplier(2, 100);
    expect(playback.state.tick).toBe(6);
    const frame = playback.frame; playback.setSpeedMultiplier(0.5, 100);
    expect(playback.frame).toEqual(frame);
    playback.tick(200); expect(playback.state.tick).toBe(9);
  });
  it('rejects invalid factors before settling elapsed time', () => {
    const playback = new Playback(testState([]), testConfig);
    playback.tick(0);
    for (const value of [0, -1, NaN, Infinity]) {
      expect(() => playback.setSpeedMultiplier(value, 1000)).toThrow(/speedMultiplier/);
      expect(playback.state.tick).toBe(0);
    }
  });
  it('single-steps exactly one tick even in the middle of several local actions', () => {
    const compute = vi.fn(state => tick(state, fastConfig, () => 0));
    const playback = new Playback(testState([resident(1, 0, 0)], 10), fastConfig, undefined, compute);
    playback.tick(0); playback.tick(50); playback.toggle(50); compute.mockClear();
    const previous = playback.state.tick;
    playback.setSpeedMultiplier(8, 100);
    expect(playback.singleStep(200)).toBe(true);
    expect(playback.state.tick).toBe(previous + 1); expect(playback.running).toBe(false);
    playback.tick(10000); expect(compute).toHaveBeenCalledTimes(1);
    playback.toggle(11000); expect(playback.singleStep(11000)).toBe(false);
  });
  it('limits tab catch-up and overload without skipping model ticks', () => {
    const playback = new Playback(testState([]), { ...testConfig, speedMultiplier: 8 });
    playback.tick(0); playback.tick(60000);
    expect(playback.state.tick).toBe(maxTicksPerFrame);
    expect(playback.pendingTicks).toBe(maxPendingTicks - maxTicksPerFrame);
    playback.tick(120000);
    expect(playback.state.tick).toBe(2 * maxTicksPerFrame);
    expect(playback.pendingTicks).toBeLessThanOrEqual(maxPendingTicks);
  });
  it('resets active actions and reservations, retains pause mode and selected factor', () => {
    const playback = new Playback(testState([resident(1, 0, 0, 19)], 10), fastConfig, () => 0);
    playback.tick(0); playback.tick(20); playback.toggle(20);
    expect(Object.keys(playback.state.reservations).length).toBeGreaterThan(0);
    playback.setSpeedMultiplier(4, 30); playback.reset(testState([]), 100);
    playback.tick(10000);
    expect(playback.state.tick).toBe(0); expect(playback.state.reservations).toEqual({});
    expect(playback.frame.shapes.size).toBe(0); expect(playback.speedMultiplier).toBe(4);
    expect(new Playback(testState([]), testConfig).speedMultiplier).toBe(2);
  });
  it('matches the same seeded world after identical tick counts with different frame sequences', () => {
    const initial = initialize(defaultConfig, seededRandom(8));
    const historyA = new History(), historyB = new History();
    historyA.reset(initial); historyB.reset(initial);
    const a = new Playback(initial, { ...defaultConfig, speedMultiplier: 1 }, seededRandom(9), undefined, state => historyA.record(state));
    const b = new Playback(initial, { ...defaultConfig, speedMultiplier: 8 }, seededRandom(9), undefined, state => historyB.record(state));
    a.tick(0); b.tick(0);
    for (let i = 1; i <= 1200; i++) a.tick(i * 1000 / 60);
    for (let i = 1; i <= 300; i++) b.tick(i * 1000 / 120);
    expect(a.state.tick).toBe(1200); expect(b.state.tick).toBe(1200);
    expect(a.state).toEqual(b.state);
    expect(historyA.values()).toEqual(historyB.values());
    expect(a.state).toEqual(advance(initial, defaultConfig, 1200, seededRandom(9)));
  });
});
