import { expect, it, vi } from 'vitest';
import { defaultConfig } from '../src/config';
import { center, drawAnimal, drawShape, layout, render } from '../src/render';
import { makeMotion, sampleAnimation, sampleMotion } from '../src/animation';
import { initialize, tick } from '../src/simulation';
import { advance, fastConfig, resident, testConfig, testState } from './fixtures';

function recordingContext() {
  return { beginPath: vi.fn(), closePath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fill: vi.fn(), ellipse: vi.fn(), clearRect: vi.fn(),
    lineWidth: 0, strokeStyle: '', fillStyle: '', lineJoin: 'round' };
}
it('renders prey during transfer and no yellow fills or strokes after removal', () => {
  let world = testState([{ ...resident(1, 1, 0, 5), readyAt: 1000 }, resident(2, 0, 0, 5, 'carnivore')], 0, fastConfig);
  world = advance(world, fastConfig, 3);
  for (let i = 0; i < 6; i++) {
    const ctx = recordingContext(), colors: string[] = [];
    ctx.fill.mockImplementation(() => { colors.push(ctx.fillStyle); });
    ctx.stroke.mockImplementation(() => { colors.push(ctx.strokeStyle); });
    const frame = sampleAnimation(world);
    render(ctx as unknown as CanvasRenderingContext2D, frame.state, fastConfig, layout(fastConfig, 800, 300), frame.shapes);
    expect(colors.includes('#ffd285')).toBe(world.animals.some(a => a.id === 1));
    expect(colors.includes('#ff7b87')).toBe(true);
    world = tick(world, fastConfig);
  }
});
it('fits every hex corner in wide and narrow canvases including single-row fields', () => {
  for (const [width, height] of [[30, 20], [1, 1], [5, 1], [1, 5], [4, 3]]) {
    for (const viewport of [200, 500, 1400]) {
      const cfg = { ...defaultConfig, width, height };
      const field = layout(cfg, viewport, 600);
      expect(field.width).toBeLessThanOrEqual(viewport + 0.001);
      expect(field.height).toBeLessThanOrEqual(600.001);
      for (let row = 0; row < height; row++) for (let column = 0; column < width; column++) {
        const [x, y] = center({ column, row }, field.radius);
        for (let i = 0; i < 6; i++) {
          const angle = (60 * i - 30) * Math.PI / 180;
          expect(x + Math.cos(angle) * field.radius).toBeGreaterThanOrEqual(0);
          expect(x + Math.cos(angle) * field.radius).toBeLessThanOrEqual(field.width);
          expect(y + Math.sin(angle) * field.radius).toBeGreaterThanOrEqual(0);
          expect(y + Math.sin(angle) * field.radius).toBeLessThanOrEqual(field.height);
        }
      }
    }
  }
});

it('draws deforming tips and their centroid with unchanged colors and energy encoding', () => {
  const animal = { column: 0, row: 0 };
  const motion = makeMotion(animal, { column: 1, row: 0 });
  for (const fraction of [0.01, 0.5, 1]) for (const time of [0, 0.1, 0.2, 0.3, 0.35, 0.45, 0.5]) {
    const ctx = recordingContext(), points = sampleMotion(motion, time);
    drawShape(ctx as unknown as CanvasRenderingContext2D, points, fraction, '#ff7b87');
    expect(ctx.strokeStyle).toBe('#ff7b87'); expect(ctx.fillStyle).toBe('#ff7b87');
    expect(ctx.lineTo.mock.calls).toContainEqual(points[0]);
    const centroid = [points.reduce((sum, p) => sum + p[0], 0) / 3, points.reduce((sum, p) => sum + p[1], 0) / 3];
    expect(ctx.moveTo.mock.calls.every(call => call[0] === centroid[0] && call[1] === centroid[1])).toBe(true);
    expect(ctx.stroke).toHaveBeenCalledTimes(fraction < 0.1 ? 3 : 0);
    expect(ctx.fill).toHaveBeenCalledTimes(fraction < 0.1 ? 0 : 6);
  }
});
it('draws all cell boundaries and grass ovals with increasing size, skipping bare soil', () => {
  const cfg = { ...defaultConfig, width: 4, height: 1,
    herbivore: { ...defaultConfig.herbivore, initialCount: 0 }, carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
  const state = initialize(cfg); state.grass = [0, 1, 5, 10];
  const ctx = recordingContext();
  render(ctx as unknown as CanvasRenderingContext2D, state, cfg, layout(cfg, 400, 100));
  expect(ctx.stroke).toHaveBeenCalledTimes(4);
  expect(ctx.ellipse).toHaveBeenCalledTimes(3);
  const radii = ctx.ellipse.mock.calls.map(call => call[2] as number);
  expect(radii[0]).toBeLessThan(radii[1]); expect(radii[1]).toBeLessThan(radii[2]);
});
it('changes three thin arms to filled wedges with increasing energy', () => {
  for (const energy of [0.01, 0.5, 1]) {
    const ctx = recordingContext();
    drawAnimal(ctx as unknown as CanvasRenderingContext2D, 20, 20, 15, energy, '#ffd285');
    expect(ctx.strokeStyle).toBe('#ffd285');
    expect(ctx.stroke).toHaveBeenCalledTimes(energy < 0.1 ? 3 : 0);
    expect(ctx.fill).toHaveBeenCalledTimes(energy < 0.1 ? 0 : 6);
  }
});
