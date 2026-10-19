import { describe, expect, it } from 'vitest';
import { planAnimation, restFrame, sampleAnimation } from '../src/animation';
import { transition } from '../src/simulation';
import { Playback } from '../src/playback';
import { hexCenter } from '../src/hex';
import { movingPrey, resident, testConfig, testState } from './fixtures';

describe('grass suction', () => {
  it('contacts grass, holds every tip while grass shrinks and energy rises, then finishes walking', () => {
    const recorded = transition(movingPrey(), testConfig, () => 0), original = structuredClone(recorded);
    const plan = planAnimation(recorded), meal = plan.grazing[0], motion = plan.motions.get(1)!;
    const contact = sampleAnimation(plan, meal.start);
    expect(contact.state.grass[meal.event.cell]).toBe(10);
    expect(contact.state.animals.find(a => a.id === 1)?.energy).toBe(5);
    expect(contact.shapes.get(1)![motion.leading]).toEqual(hexCenter(meal.event.animal));
    for (const progress of [0.25, 0.5, 0.75, 1]) {
      const frame = sampleAnimation(plan, meal.start + (meal.end - meal.start) * progress);
      expect(frame.state.grass[meal.event.cell]).toBeCloseTo(10 * (1 - progress));
      expect(frame.state.animals.find(a => a.id === 1)?.energy).toBeCloseTo(5 + 10 * progress);
      expect(frame.shapes.get(1)).toEqual(contact.shapes.get(1));
    }
    const following = sampleAnimation(plan, (meal.end + meal.accountedAt) / 2);
    expect(following.shapes.get(1)).not.toEqual(contact.shapes.get(1));
    expect(following.state.grass[meal.event.cell]).toBe(0);
    const midpoint = sampleAnimation(plan, (meal.start + meal.end) / 2);
    sampleAnimation(plan, 1);
    expect(sampleAnimation(plan, (meal.start + meal.end) / 2)).toEqual(midpoint);
    expect(recorded).toEqual(original);
    expect(sampleAnimation(plan, 1)).toEqual(restFrame(recorded.after, plan.endAngles));
  });

  it.each([0, 0.5, 1])('preserves grass efficiency %s and caps the visible energy of stationary grazers', efficiency => {
    const config = { ...testConfig, width: 1, height: 1, grassEfficiency: efficiency };
    const plan = planAnimation(transition(testState([resident(1, 0, 0, 18)], 10, config), config, () => 0));
    const meal = plan.grazing[0];
    expect(plan.motions.size).toBe(0);
    const mid = sampleAnimation(plan, (meal.start + meal.end) / 2);
    expect(mid.state.grass[0]).toBeCloseTo(5);
    expect(mid.state.animals[0].energy).toBeCloseTo((18 + Math.min(20, 18 + 10 * efficiency)) / 2);
    expect(sampleAnimation(plan, meal.end).state.grass[0]).toBe(0);
    expect(sampleAnimation(plan, 1).state).toEqual(plan.transition.after);
  });

  it.each([2, 3])('lets dividing halves drain grass before following through with width %s', width => {
    const config = { ...testConfig, width, height: 1 };
    const plan = planAnimation(transition(testState([resident(1, 0, 0, 19)], 10, config), config, () => 0));
    const division = plan.divisions.get(1)!;
    const meals = plan.grazing.filter(g => g.event.afterDivision);
    expect(meals).toHaveLength(width === 2 ? 1 : 2);
    for (const meal of meals) {
      const at = sampleAnimation(plan, meal.start), mid = sampleAnimation(plan, (meal.start + meal.end) / 2);
      expect(at.state.animals.find(a => a.id === meal.event.animal.id)?.energy).toBe(9);
      expect(mid.state.animals.find(a => a.id === meal.event.animal.id)?.energy).toBeCloseTo(14);
      expect(mid.state.grass[meal.event.cell]).toBeCloseTo(5);
      expect(mid.shapes.get(meal.event.animal.id)).toEqual(at.shapes.get(meal.event.animal.id));
      expect(sampleAnimation(plan, meal.end).state.grass[meal.event.cell]).toBe(0);
    }
    if (width === 2) {
      expect(sampleAnimation(plan, 0.45).state.animals.find(a => a.id === 1)?.energy).toBe(9);
      expect(division.parentMotion).toBeUndefined();
    }
    expect(sampleAnimation(plan, 0.5).state.grass.every(g => g === 0)).toBe(true);
    expect(sampleAnimation(plan, 1)).toEqual(restFrame(plan.transition.after, plan.endAngles));
  });

  it('creates no imaginary grass or energy on bare ground', () => {
    const config = { ...testConfig, grassGrowth: 0 };
    const plan = planAnimation(transition(testState([resident(1, 0, 0)]), config, () => 0));
    expect(plan.grazing).toEqual([]);
    for (const time of [0.2, 0.25, 0.3]) expect(sampleAnimation(plan, time).state.grass.every(g => g === 0)).toBe(true);
  });

  it.each([0.25, 8])('freezes and resumes grass intake at %s steps/s without consuming twice', rate => {
    const config = { ...testConfig, stepsPerSecond: rate };
    const playback = new Playback(movingPrey(), config, () => 0);
    let now = 0.25 * 1000 / rate;
    playback.tick(0); playback.tick(now); playback.toggle(now);
    const frozen = playback.frame;
    expect(frozen.state.grass[1]).toBeCloseTo(5);
    playback.setStepsPerSecond(rate === 8 ? 0.25 : 8, now + 100);
    now += 1000; playback.tick(now);
    expect(playback.frame).toEqual(frozen);
    playback.toggle(now);
    expect(playback.frame).toEqual(frozen);
    playback.tick(now + 100000);
    expect(playback.state).toEqual(transition(movingPrey(), testConfig, () => 0).after);
  });
});
