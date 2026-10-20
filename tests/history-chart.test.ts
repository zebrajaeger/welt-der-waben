import { describe, expect, it } from 'vitest';
import { chartScales, compactPoints, projectHistory, timeSpans } from '../src/history-chart';
import { measure } from '../src/history';
import { testState } from './fixtures';

const samples = (lastTick: number) => Array.from({ length: lastTick + 1 }, (_, tick) => ({ ...measure(testState([])), tick }));

describe('history projection', () => {
  it('anchors now at the right edge and leaves time before the run blank', () => {
    const data = samples(120), projection = projectHistory(data, 'scroll', 10);
    expect(projection.cursor).toBe(1);
    expect(projection.segments[0][0].x).toBe(0.8);
    expect(projection.segments[0].at(-1)?.x).toBe(1);
    expect(projection.sections[0]).toEqual({ from: 0.8, to: 1, start: 0, end: 2, previous: false });
    expect(projectHistory(samples(900), 'scroll', 10).segments[0][0].sample.tick).toBe(300);
  });
  it('keeps the old right side and new left side as separate paths', () => {
    const projection = projectHistory(samples(750), 'sweep', 10);
    expect(projection.cursor).toBe(0.25);
    const [previous, current] = projection.segments;
    expect(previous[0].sample.tick).toBe(151);
    expect(previous.at(-1)?.sample.tick).toBe(599);
    expect(previous.every(point => point.x > projection.cursor)).toBe(true);
    expect(current[0]).toMatchObject({ x: 0, sample: { tick: 600 } });
    expect(current.at(-1)?.x).toBe(0.25);
    expect(projection.sections.map(section => [section.start, section.end])).toEqual([[10, 12.5], [2.5, 10]]);
  });
  it('wraps to the left at an exact boundary without joining sweeps', () => {
    const projection = projectHistory(samples(600), 'sweep', 10);
    expect(projection.cursor).toBe(0);
    expect(projection.segments[1]).toHaveLength(1);
    expect(projection.segments[1][0].sample.tick).toBe(600);
    expect(projection.segments[0].every(point => point.sample.tick < 600 && point.x > 0)).toBe(true);
    expect(projectHistory(samples(120), 'sweep', 10).segments[0]).toHaveLength(0);
  });
  it('can change modes and time spans using the same unmodified samples', () => {
    const data = samples(900), before = structuredClone(data);
    expect(projectHistory(data, 'scroll', 10).segments[0].at(-1)?.sample).toEqual(data.at(-1));
    expect(projectHistory(data, 'sweep', 30).cursor).toBe(0.5);
    expect(data).toEqual(before);
  });
  it('moves twice as far per simulated second at 30 seconds instead of 60', () => {
    expect(timeSpans).toEqual([10, 30, 60, 120, 300]);
    for (const mode of ['scroll', 'sweep'] as const) {
      const a = projectHistory(samples(60), mode, 60), b = projectHistory(samples(60), mode, 30);
      const distance = (projection: typeof a) => {
        const segment = projection.segments.at(-1)!;
        return segment.at(-1)!.x - segment[0].x;
      };
      expect(distance(b)).toBeCloseTo(distance(a) * 2);
    }
  });
  it('scales only selected visible values, independently for counts and energy', () => {
    const data = samples(900).map(sample => ({ ...sample, carnivoreCount: 4, herbivoreCount: 8,
      carnivoreEnergy: sample.tick < 300 ? 1e6 : 200, grassEnergy: 1000 }));
    const projection = projectHistory(data, 'scroll', 10);
    expect(chartScales(projection, ['carnivoreCount', 'carnivoreEnergy'])).toEqual({ count: 4, energy: 200 });
    expect(chartScales(projection, ['grassEnergy'])).toEqual({ energy: 1000 });
    expect(chartScales(projection, [])).toEqual({});
    expect(chartScales(projectHistory(samples(60), 'sweep', 10), ['herbivoreCount', 'herbivoreEnergy'])).toEqual({ count: 1, energy: 1 });
  });
  it('retains extrema and endpoints in time order per pixel without mutating data', () => {
    const values = [5, 8, 2, 100, 4, 6, 3];
    const points = samples(6).map((sample, i) => ({ x: i / 1000, sample: { ...sample, grassEnergy: values[i] } }));
    const result = compactPoints(points, 'grassEnergy', 100);
    expect(result.map(point => point.sample.grassEnergy)).toEqual([5, 2, 100, 3]);
    expect(result.map(point => point.sample.tick)).toEqual([0, 2, 3, 6]);
    expect(points).toHaveLength(7);
  });
  it('keeps sweep boundaries separate during compaction', () => {
    const projection = projectHistory(samples(750), 'sweep', 10);
    const [previous, current] = projection.segments.map(segment => compactPoints(segment, 'grassEnergy', 20));
    expect(previous[0].sample.tick).toBe(151); expect(previous.at(-1)?.sample.tick).toBe(599);
    expect(current[0].sample.tick).toBe(600); expect(current.at(-1)?.sample.tick).toBe(750);
    for (const segment of [previous, current]) {
      expect(segment.length).toBeLessThan(60);
      expect(segment.every((point, i) => i === 0 || segment[i - 1].sample.tick < point.sample.tick)).toBe(true);
    }
  });
});
