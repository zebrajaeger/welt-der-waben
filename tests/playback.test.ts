import { describe, expect, it, vi } from 'vitest';
import { Playback } from '../src/playback';
import { step, transition } from '../src/simulation';
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
    expect(playback.frame.state.animals.some(a => a.id === 1)).toBe(false);
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
