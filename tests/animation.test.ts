import { describe, expect, it } from 'vitest';
import { animalRadius, defaultAngle, makeMotion, planAnimation, restFrame, sampleAnimation, sampleDivision, sampleMotion, starPoints, type Point } from '../src/animation';
import { hexCenter, neighbors } from '../src/hex';
import { initialize, transition, type Animal } from '../src/simulation';
import { defaultConfig } from '../src/config';
import { movingPrey, resident, seededRandom, testConfig, testState } from './fixtures';

const animal: Animal = { id: 1, species: 'herbivore', column: 2, row: 2, energy: 10, activeFrom: 1 };
const closePoint = (a: Point, b: Point) => { expect(a[0]).toBeCloseTo(b[0], 10); expect(a[1]).toBeCloseTo(b[1], 10); };

describe('visible predation energy transfer', () => {
  it.each([
    { energy: 5, efficiency: 0.5, expected: 11.5 },
    { energy: 18, efficiency: 1, expected: 20 },
    { energy: 5, efficiency: 0, expected: 5 },
    { energy: 20, efficiency: 1, expected: 20 },
  ])('drains prey continuously with hunter energy $energy and efficiency $efficiency', ({ energy, efficiency, expected }) => {
    const config = { ...testConfig, preyEfficiency: efficiency };
    const state = movingPrey(); state.animals[1].energy = energy;
    const recorded = transition(state, config, () => 0);
    const snapshot = structuredClone(recorded);
    const plan = planAnimation(recorded, new Map([[1, 1.2], [2, 0.6]]));
    const at = sampleAnimation(plan, 0.5), target = hexCenter({ column: 1, row: 0 });
    const energyOf = (t: number, id: number) => sampleAnimation(plan, t).state.animals.find(a => a.id === id)!.energy;
    expect(energyOf(0.5, 1)).toBe(13);
    expect(energyOf(0.5, 2)).toBe(energy);
    for (const [t, remaining] of [[0.5, 1], [0.5375, 0.75], [0.575, 0.5], [0.6125, 0.25], [0.65 - 1e-9, 1e-9 / 0.15]]) {
      const frame = sampleAnimation(plan, t);
      expect(energyOf(t, 1)).toBeCloseTo(13 * remaining);
      expect(energyOf(t, 2)).toBeCloseTo(energy + (expected - energy) * (1 - remaining));
      frame.shapes.get(1)!.forEach((p, i) => closePoint(p, [target[0] + (at.shapes.get(1)![i][0] - target[0]) * remaining,
        target[1] + (at.shapes.get(1)![i][1] - target[1]) * remaining]));
      expect(frame.shapes.get(2)).toEqual(at.shapes.get(2));
      expect(new Set(frame.state.animals.map(a => a.id)).size).toBe(frame.state.animals.length);
    }
    expect(sampleAnimation(plan, 0.65).state.animals.some(a => a.id === 1)).toBe(false);
    expect(sampleAnimation(plan, 0.65).shapes.has(1)).toBe(false);
    expect(energyOf(0.65, 2)).toBe(expected);
    const midpoint = sampleAnimation(plan, 0.575);
    sampleAnimation(plan, 1); sampleAnimation(plan, 0.2);
    expect(sampleAnimation(plan, 0.575)).toEqual(midpoint);
    expect(recorded).toEqual(snapshot);
    expect(sampleAnimation(plan, 1)).toEqual(restFrame(recorded.after, plan.endAngles));
  });
});

describe('three-tip motion', () => {
  it('selects the nearest actual tip in all directions, parities and persisted orientations', () => {
    for (const row of [1, 2]) for (const angle of [defaultAngle, 0, 1.5]) {
      const resident = { ...animal, row };
      for (const to of neighbors(resident, 5, 5)) {
        const motion = makeMotion(resident, to, angle);
        expect(motion.start).toEqual(starPoints(hexCenter(resident), animalRadius, angle));
        const distances = motion.start.map(p => Math.hypot(p[0] - motion.target[0], p[1] - motion.target[1]));
        expect(distances[motion.leading]).toBeCloseTo(Math.min(...distances), 10);
        const farthest = motion.end.map(p => Math.hypot(p[0] - hexCenter(resident)[0], p[1] - hexCenter(resident)[1]));
        expect(farthest[motion.leading]).toBeCloseTo(Math.max(...farthest), 10);
        closePoint([motion.end.reduce((sum, p) => sum + p[0], 0) / 3, motion.end.reduce((sum, p) => sum + p[1], 0) / 3], motion.target);
        const next = makeMotion({ ...resident, ...to }, resident, motion.endAngle);
        expect(next.start).toEqual(motion.end);
      }
    }
  });
  it('breaks exact ties by tip index', () => {
    // With one point facing right, an exactly leftward target is equidistant from tips 1 and 2.
    expect(makeMotion(animal, { column: 1, row: 2 }, 0).leading).toBe(1);
  });
  it.each(['herbivore', 'carnivore'] as const)('%s extends one tip, then moves the others one at a time', species => {
    const motion = makeMotion({ ...animal, species }, { column: 3, row: 2 });
    const [begin, contact, secondEnd, end] = species === 'herbivore' ? [0, 0.2, 0.35, 0.5] : [0.3, 0.5, 0.75, 1];
    const first = motion.leading, second = (first + 1) % 3, third = (first + 2) % 3;
    expect(sampleMotion(motion, begin)).toEqual(motion.start);
    const stretched = sampleMotion(motion, contact);
    closePoint(stretched[first], motion.target);
    expect(stretched[second]).toEqual(motion.start[second]);
    expect(stretched[third]).toEqual(motion.start[third]);
    const two = sampleMotion(motion, secondEnd);
    closePoint(two[second], motion.end[second]);
    expect(two[third]).toEqual(motion.start[third]);
    expect(two[first]).not.toEqual(stretched[first]);
    expect(sampleMotion(motion, end)).toEqual(motion.end);
    for (const boundary of [begin, contact, secondEnd, end]) {
      const left = sampleMotion(motion, boundary - 1e-7), right = sampleMotion(motion, boundary + 1e-7);
      left.forEach((point, i) => {
        expect(Math.hypot(point[0] - right[i][0], point[1] - right[i][1])).toBeLessThan(1e-5);
      });
    }
  });
});

describe('shared movement and hunting timeline', () => {
  it.each([false, true])('holds all hunter tips during transfer before following through (division=%s)', divides => {
    const config = { ...testConfig, width: 2, height: 1 };
    const plan = planAnimation(transition(testState([resident(1, 0, 0, divides ? 18 : 5, 'carnivore'),
      resident(2, 1, 0)], 0, config), config, () => 0));
    const motion = plan.motions.get(1)!;
    const [, contact, secondEnd, end] = motion.timing;
    const at = sampleMotion(motion, contact);
    closePoint(at[motion.leading], motion.target);
    for (const t of [0.5, 0.55, 0.6, 0.65]) expect(sampleMotion(motion, t)).toEqual(at);
    const second = (motion.leading + 1) % 3, third = (motion.leading + 2) % 3;
    expect(sampleMotion(motion, secondEnd)[second]).toEqual(motion.end[second]);
    expect(sampleMotion(motion, secondEnd)[third]).toEqual(motion.start[third]);
    expect(sampleMotion(motion, end)).toEqual(motion.end);
    expect(end).toBe(divides ? 0.8 : 1);
    for (const boundary of [...motion.timing, motion.followStart]) {
      const left = sampleMotion(motion, boundary - 1e-7), right = sampleMotion(motion, boundary + 1e-7);
      left.forEach((p, i) => expect(Math.hypot(p[0] - right[i][0], p[1] - right[i][1])).toBeLessThan(1e-5));
    }
  });
  it('starts draining moved prey at arrival and holds contact until transfer finishes', () => {
    const recorded = transition(movingPrey(), testConfig, () => 0), plan = planAnimation(recorded);
    const preyMotion = plan.motions.get(1)!, hunterMotion = plan.motions.get(2)!;
    const before = sampleAnimation(plan, 0.5 - 1e-6);
    expect(before.state.animals.map(a => a.id)).toEqual([1, 2]);
    const at = sampleAnimation(plan, 0.5);
    expect(at.state.animals.map(a => a.id)).toEqual([2, 1]);
    expect(sampleMotion(preyMotion, 0.5)).toEqual(preyMotion.end);
    closePoint(at.shapes.get(2)![hunterMotion.leading], hexCenter({ column: 1, row: 0 }));
    const second = (hunterMotion.leading + 1) % 3, third = (hunterMotion.leading + 2) % 3;
    expect(at.shapes.get(2)![second]).toEqual(hunterMotion.start[second]);
    expect(at.shapes.get(2)![third]).toEqual(hunterMotion.start[third]);
    expect(at.state.animals[0].energy).toBe(5);
    expect(sampleAnimation(plan, 0.65).state.animals.map(a => a.id)).toEqual([2]);
    expect(sampleAnimation(plan, 0.65).state.animals[0].energy).toBe(11.5);
    expect(sampleAnimation(plan, 1).state.animals[0].energy).toBe(9.5);
    expect(sampleAnimation(plan, 0.825).shapes.get(2)![second]).toEqual(hunterMotion.end[second]);
    expect(sampleAnimation(plan, 1).state).toEqual(recorded.after);
  });
  it('keeps losers stationary and runs independent successful hunts in parallel', () => {
    const cfg = { ...testConfig, width: 6, height: 1 };
    const residents = [resident(1, 0, 0, 5, 'carnivore'), resident(2, 1, 0), resident(3, 2, 0, 5, 'carnivore'),
      resident(4, 3, 0, 5, 'carnivore'), resident(5, 4, 0), resident(6, 5, 0, 5, 'carnivore')];
    const plan = planAnimation(transition(testState(residents, 0, cfg), cfg, () => 0));
    expect([...plan.motions.keys()]).toEqual([1, 4]);
    expect(sampleAnimation(plan, 0.499).state.animals).toHaveLength(6);
    expect(sampleAnimation(plan, 0.5).state.animals).toHaveLength(6);
    expect(sampleAnimation(plan, 0.575).state.animals).toHaveLength(6);
    expect(sampleAnimation(plan, 0.65).state.animals).toHaveLength(4);
    for (const time of [0.5, 0.575, 0.65]) {
      const frame = sampleAnimation(plan, time);
      expect(new Set(frame.state.animals.map(a => a.id)).size).toBe(frame.state.animals.length);
      for (const id of [3, 6]) expect(frame.state.animals.find(a => a.id === id)?.energy).toBe(5);
      for (const event of plan.hunts) {
        expect(frame.state.animals.find(a => a.id === event.animal.id)?.energy).toBeCloseTo(
          time === 0.5 ? 5 : time === 0.65 ? event.energyAfter : (5 + event.energyAfter) / 2);
      }
    }
    for (const time of [0, 0.4, 0.5, 0.8, 1]) {
      const frame = sampleAnimation(plan, time);
      expect(frame.shapes.get(3)).toEqual(starPoints(hexCenter(residents[2])));
      expect(frame.shapes.get(6)).toEqual(starPoints(hexCenter(residents[5])));
    }
  });
  it('handles newborn prey and birth positions without inventing a newborn motion', () => {
    const state = testState([resident(1, 0, 0, 19), resident(2, 1, 0, 5, 'carnivore')], 10);
    const choices = [0, 0, 0.3, 0, 0, 0];
    const plan = planAnimation(transition(state, testConfig, () => choices.shift() ?? 0));
    expect(plan.motions.has(100)).toBe(false);
    expect(plan.motions.get(2)?.target).toEqual(hexCenter({ column: 0, row: 0 }));
    expect(plan.transition.herbivores.animals.find(a => a.id === 100)).toMatchObject({ column: 0, row: 0 });
    expect(sampleAnimation(plan, 0.5).state.animals.some(a => a.id === 100)).toBe(true);
    expect(sampleAnimation(plan, 0.65).state.animals.some(a => a.id === 100)).toBe(false);
    const birthPlan = planAnimation(transition(testState([resident(1, 0, 0, 19)], 10), testConfig, () => 0));
    expect(sampleAnimation(birthPlan, 0.299).shapes.has(100)).toBe(false);
    expect(sampleAnimation(birthPlan, 0.499).shapes.has(100)).toBe(true);
    expect(sampleAnimation(birthPlan, 0.5).shapes.get(100)).toEqual(birthPlan.divisions.get(100)?.childMotion.end);
  });
  it('shows herbivore deaths at arrival and carnivore deaths or births only after following through', () => {
    const plan = planAnimation(transition(testState([resident(1, 0, 0, 1), resident(2, 4, 3, 1, 'carnivore')]), testConfig, () => 0));
    expect(sampleAnimation(plan, 0.499).shapes.has(1)).toBe(true);
    expect(sampleAnimation(plan, 0.5).shapes.has(1)).toBe(false);
    expect(sampleAnimation(plan, 0.999).shapes.has(2)).toBe(true);
    expect(sampleAnimation(plan, 1).shapes.size).toBe(0);
    const cfg = { ...testConfig, width: 2, height: 1 };
    const birthPlan = planAnimation(transition(testState([resident(1, 0, 0, 18, 'carnivore'), resident(2, 1, 0)], 0, cfg), cfg, () => 0));
    expect(sampleAnimation(birthPlan, 0.799).shapes.has(100)).toBe(false);
    expect(sampleAnimation(birthPlan, 0.999).shapes.has(100)).toBe(true);
    expect(sampleAnimation(birthPlan, 1).shapes.get(100)).toEqual(birthPlan.divisions.get(100)?.childMotion.end);
  });
  it('ends with the exact rest frame and retains only living orientations over many steps', () => {
    const random = seededRandom();
    let state = initialize(defaultConfig, random), angles: ReadonlyMap<number, number> = new Map();
    for (let i = 0; i < 100; i++) {
      const plan = planAnimation(transition(state, defaultConfig, random), angles);
      expect(sampleAnimation(plan, 0).shapes).toEqual(restFrame(state, angles).shapes);
      expect(sampleAnimation(plan, 1)).toEqual(restFrame(plan.transition.after, plan.endAngles));
      expect(plan.endAngles.size).toBe(plan.transition.after.animals.length);
      state = plan.transition.after; angles = plan.endAngles;
    }
  });
});

describe.each(['herbivore', 'carnivore'] as const)('%s visible division', species => {
  it.each([2, 3])('splits from one full form into two halves with %s cells available', width => {
    const config = { ...testConfig, width, height: 1 };
    const parent = resident(1, species === 'carnivore' && width === 3 ? 1 : 0, 0, 19, species);
    const plan = planAnimation(transition(testState([parent], 10, config), config, () => 0));
    const division = plan.divisions.get(1)!;
    const { parentBefore, parentAfter, animal: child } = division.event;
    expect(Boolean(division.parentMotion)).toBe(width === 3);
    const start = sampleAnimation(plan, division.start);
    expect(start.shapes.has(child.id)).toBe(false);
    expect(start.state.animals.find(a => a.id === 1)?.energy).toBe(parentBefore.energy);
    const before = sampleAnimation(plan, division.start - 1e-7).shapes.get(1)!;
    before.forEach((point, i) => closePoint(point, start.shapes.get(1)![i]));
    const puff = sampleDivision(division, (division.start + division.childMotion.timing[0]) / 2);
    const origin = hexCenter(parentBefore);
    expect(Math.hypot(puff.parent[0][0] - origin[0], puff.parent[0][1] - origin[1])).toBeGreaterThan(animalRadius);
    const midTime = (division.childMotion.timing[0] + division.end) / 2;
    const middle = sampleAnimation(plan, midTime);
    expect(middle.shapes.has(child.id)).toBe(true);
    expect(middle.state.animals.find(a => a.id === child.id)?.energy).toBeCloseTo(species === 'herbivore' ? 14 : parentBefore.energy * 0.75);
    expect(middle.shapes.get(1)).not.toEqual(middle.shapes.get(child.id));
    const end = sampleAnimation(plan, division.end);
    expect(end.state.animals.find(a => a.id === 1)?.energy).toBe(parentBefore.energy / 2 + (species === 'herbivore' && width === 3 ? 10 : 0));
    expect(end.state.animals.find(a => a.id === child.id)?.energy).toBe(parentBefore.energy / 2 + (species === 'herbivore' ? 10 : 0));
    expect(end.shapes.get(child.id)).toEqual(division.childMotion.end);
    expect(end.shapes.get(1)).toEqual(division.parentMotion?.end ?? starPoints(hexCenter(parentAfter), animalRadius, division.angle));
    for (const boundary of [division.start, ...division.childMotion.timing]) {
      const left = sampleDivision(division, boundary - 1e-7), right = sampleDivision(division, boundary + 1e-7);
      left.parent.forEach((point, i) => expect(Math.hypot(point[0] - right.parent[i][0], point[1] - right.parent[i][1])).toBeLessThan(1e-5));
      if (left.child && right.child) left.child.forEach((point, i) => expect(Math.hypot(point[0] - right.child![i][0], point[1] - right.child![i][1])).toBeLessThan(1e-5));
    }
  });
  it('does not create phantom halves when division is impossible', () => {
    const config = { ...testConfig, width: 1, height: 1 };
    const plan = planAnimation(transition(testState([resident(1, 0, 0, 19, species)], 10, config), config, () => 0));
    expect(plan.divisions.size).toBe(0);
    expect(sampleAnimation(plan, 0.9).shapes.size).toBe(1);
  });
});

it('finishes a prey half at the exact contact point and preserves the other half', () => {
  const state = testState([resident(1, 0, 0, 19), resident(2, 1, 0, 5, 'carnivore')], 10);
  const choices = [0, 0, 0.3, 0, 0, 0, 0];
  const plan = planAnimation(transition(state, testConfig, () => choices.shift() ?? 0));
  const division = plan.divisions.get(100)!;
  expect(sampleAnimation(plan, 0.499).shapes.has(100)).toBe(true);
  expect(sampleAnimation(plan, 0.5).shapes.has(100)).toBe(true);
  expect(sampleAnimation(plan, 0.65).shapes.has(100)).toBe(false);
  expect(sampleAnimation(plan, 0.5).shapes.has(1)).toBe(true);
  const hunter = plan.motions.get(2)!;
  const contactTip = sampleAnimation(plan, 0.5).shapes.get(2)![hunter.leading];
  closePoint(contactTip, hexCenter(division.event.animal));
  expect(sampleDivision(division, 0.5).child).toEqual(division.childMotion.end);
  const at = sampleAnimation(plan, 0.5), middle = sampleAnimation(plan, 0.575);
  expect(at.shapes.get(100)).toEqual(division.childMotion.end);
  expect(middle.shapes.get(1)).toEqual(at.shapes.get(1));
  expect(middle.state.animals.find(a => a.id === 1)).toEqual(at.state.animals.find(a => a.id === 1));
  expect(middle.state.animals.find(a => a.id === 100)?.energy).toBeCloseTo(plan.hunts[0].prey.energy / 2);
  expect(middle.state.grass).toEqual(plan.transition.herbivores.grass);
  for (const time of [0.5, 0.575, 0.65, 0.8, 1]) {
    const frame = sampleAnimation(plan, time);
    expect(new Set(frame.state.animals.map(a => a.id)).size).toBe(frame.state.animals.length);
  }
  expect(sampleAnimation(plan, 1)).toEqual(restFrame(plan.transition.after, plan.endAngles));
});

it('drains division target grass before both halves finish their steps', () => {
  const config = { ...testConfig, width: 3, height: 1 };
  const recorded = transition(testState([resident(1, 0, 0, 19)], 10, config), config, () => 0);
  const plan = planAnimation(recorded);
  const meal = plan.grazing.find(g => g.event.afterDivision)!;
  const before = sampleAnimation(plan, meal.start);
  expect(before.state.grass).toEqual([10, 0, 10]);
  expect(before.state.animals.every(a => a.energy < 10)).toBe(true);
  const middle = sampleAnimation(plan, (meal.start + meal.end) / 2);
  expect(middle.state.grass[0]).toBeCloseTo(5);
  expect(middle.state.grass[2]).toBeCloseTo(5);
  const drained = sampleAnimation(plan, meal.end);
  expect(drained.state.grass).toEqual([0, 0, 0]);
  expect(drained.state.animals.map(a => a.energy)).toEqual([19, 19]);
  const arrived = sampleAnimation(plan, 0.5);
  expect(arrived.state.grass).toEqual([0, 0, 0]);
  expect(arrived.state.animals.map(a => a.energy)).toEqual([19, 19]);
  expect(recorded.events.find(e => e.type === 'birth')).toMatchObject({ parentAfter: { energy: 9 }, animal: { energy: 9 } });
});
