import { describe, expect, it } from 'vitest';
import { animalRadius, defaultAngle, makeMotion, sampleAnimation, sampleMotion, starPoints, travelShape, type Point } from '../src/animation';
import { hexCenter, neighbors } from '../src/hex';
import { tick, type TravelAction } from '../src/simulation';
import { advance, fastConfig, resident, testState } from './fixtures';
const close = (a: Point, b: Point) => { expect(a[0]).toBeCloseTo(b[0], 9); expect(a[1]).toBeCloseTo(b[1], 9); };

describe('local three-tip animation', () => {
  it('holds contact and follows through continuously in all directions and orientations', () => {
    for (const row of [1, 2]) for (const angle of [defaultAngle, 0, 1.5]) {
      const from = { column: 2, row };
      for (const to of neighbors(from, 5, 5)) {
        const m = makeMotion(from, to, angle, [10, 22, 48, 54], 42);
        const distances = m.start.map(p => Math.hypot(p[0] - m.target[0], p[1] - m.target[1]));
        expect(distances[m.leading]).toBeCloseTo(Math.min(...distances), 10);
        const farthest = m.end.map(p => Math.hypot(p[0] - hexCenter(from)[0], p[1] - hexCenter(from)[1]));
        expect(farthest[m.leading]).toBeCloseTo(Math.max(...farthest), 10);
        expect(makeMotion(to, from, m.endAngle).start).toEqual(m.end);
        for (const t of [22, 25, 30, 40, 42]) expect(sampleMotion(m, t)).toEqual(sampleMotion(m, 22));
        const second = (m.leading + 1) % 3, third = (m.leading + 2) % 3;
        close(sampleMotion(m, 48)[second], m.end[second]);
        expect(sampleMotion(m, 48)[third]).toEqual(m.start[third]);
        expect(sampleMotion(m, 54)).toEqual(m.end);
        for (const boundary of [10, 22, 42, 48, 54]) {
          const left = sampleMotion(m, boundary - 1e-7), right = sampleMotion(m, boundary + 1e-7);
          left.forEach((p, i) => expect(Math.hypot(p[0] - right[i][0], p[1] - right[i][1])).toBeLessThan(1e-5));
        }
      }
    }
  });
  it('resolves exact ties by tip index', () => {
    expect(makeMotion({ column: 2, row: 2 }, { column: 1, row: 2 }, 0).leading).toBe(1);
  });
  it('holds throughout grass transfer and preserves the final orientation', () => {
    let world = testState([resident(1, 0, 0)], 0, fastConfig); world.grass[1] = 8;
    world = advance(world, fastConfig, 3);
    expect((world.animals[0].action as TravelAction).phase).toBe('transfer');
    const pose = sampleAnimation(world).shapes.get(1);
    for (let i = 0; i < 7; i++) { world = tick(world, fastConfig); expect(sampleAnimation(world).shapes.get(1)).toEqual(pose); }
    while (world.animals[0].action) world = tick(world, fastConfig);
    expect(sampleAnimation(world).shapes.get(1)).toEqual(starPoints(hexCenter(world.animals[0]), animalRadius, world.animals[0].angle));
  });
  it('returns continuously with live prey and recovers its radius without restoring energy', () => {
    const config = { ...fastConfig, carnivore: { ...fastConfig.carnivore, divisionFraction: 0.99 } };
    let world = testState([{ ...resident(1, 1, 0, 10), readyAt: 1000 }, resident(2, 0, 0, 18, 'carnivore')], 0, config);
    while ((world.animals[1].action as TravelAction | undefined)?.phase !== 'return') world = tick(world, config);
    const action = world.animals[1].action as TravelAction;
    expect(travelShape(action, world.tick)).toEqual(action.returnFrom);
    const frame = sampleAnimation(world), original = structuredClone(world);
    expect(frame.shapes.has(1)).toBe(true); expect(sampleAnimation(world)).toEqual(frame); expect(world).toEqual(original);
    const energy = world.animals[0].energy;
    world = advance(world, config, config.approachTicks);
    for (const a of world.animals) expect(sampleAnimation(world).shapes.get(a.id)).toEqual(starPoints(hexCenter(a), animalRadius, a.angle));
    expect(world.animals[0].energy).toBeLessThan(energy);
  });
  it('reverses from the reached shape if prey dies before contact', () => {
    const config = { ...fastConfig, approachTicks: 12 };
    let world = testState([{ ...resident(1, 1, 0), readyAt: 1000 }, resident(2, 0, 0, 5, 'carnivore')], 0, config);
    world = advance(world, config, 3);
    const expected = travelShape(world.animals[1].action as TravelAction, world.tick + 1);
    world.animals[0].energy = 1e-12; world = tick(world, config);
    expect(sampleAnimation(world).shapes.get(2)).toEqual(expected);
  });
  it('draws independent halves and no shapes for dead identities', () => {
    const config = { ...fastConfig, width: 3 };
    let world = testState([resident(1, 1, 0, 19)], 0, config); world.grass[2] = 10;
    world = advance(world, config, 10);
    expect(world.animals).toHaveLength(2);
    expect(sampleAnimation(world).shapes.get(1)).not.toEqual(sampleAnimation(world).shapes.get(100));
    world.animals.find(a => a.id === 100)!.energy = 1e-12; world = tick(world, config);
    expect(sampleAnimation(world).shapes.has(100)).toBe(false);
  });
});
