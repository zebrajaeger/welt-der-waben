import { ticksPerSecond, type Config } from './config';
import { cellIndex, hexCenter, neighbors, type Position } from './hex';
import type { Animal, State, TravelAction } from './simulation';

export type Point = [number, number];
export type Tips = [Point, Point, Point];
export const defaultAngle = -Math.PI / 2;
export const animalRadius = 0.73;
export interface Motion {
  start: Tips; end: Tips; target: Point; leading: number; endAngle: number;
  timing: readonly [number, number, number, number]; followStart: number;
}
export function starPoints(center: Point, radius = animalRadius, angle = defaultAngle): Tips {
  return [0, 1, 2].map(i => [center[0] + Math.cos(angle + i * 2 * Math.PI / 3) * radius,
    center[1] + Math.sin(angle + i * 2 * Math.PI / 3) * radius]) as Tips;
}
export function makeMotion(from: Position, to: Position, angle = defaultAngle,
  timing: Motion['timing'] = [0, 12, 18, 24], followStart = timing[1]): Motion {
  const origin = hexCenter(from), target = hexCenter(to), start = starPoints(origin, animalRadius, angle);
  const distance = (point: Point) => (point[0] - target[0]) ** 2 + (point[1] - target[1]) ** 2;
  let leading = 0;
  for (let i = 1; i < 3; i++) if (distance(start[i]) < distance(start[leading]) - 1e-10) leading = i;
  const endAngle = Math.atan2(target[1] - origin[1], target[0] - origin[0]) - leading * Math.PI * 2 / 3;
  return { start, end: starPoints(target, animalRadius, endAngle), target, leading, endAngle, timing, followStart };
}
export function mix(a: Point, b: Point, progress: number): Point {
  const p = Math.max(0, Math.min(1, progress)), eased = p * p * (3 - 2 * p);
  return [a[0] + (b[0] - a[0]) * eased, a[1] + (b[1] - a[1]) * eased];
}
export function sampleMotion(motion: Motion, time: number): Tips {
  const [begin, contact, secondEnd, end] = motion.timing;
  if (time <= begin) return motion.start;
  if (time >= end) return motion.end;
  return motion.start.map((point, i) => i === motion.leading
    ? time <= contact ? mix(point, motion.target, (time - begin) / (contact - begin))
      : mix(motion.target, motion.end[i], (time - motion.followStart) / (end - motion.followStart))
    : mix(point, motion.end[i], (time - (i === (motion.leading + 1) % 3 ? motion.followStart : secondEnd)) /
      (i === (motion.leading + 1) % 3 ? secondEnd - motion.followStart : end - secondEnd))) as Tips;
}
export function travelShape(action: TravelAction, time: number): Tips {
  if (action.from.column === action.to.column && action.from.row === action.to.row) return starPoints(hexCenter(action.from), animalRadius, action.angle);
  const contact = action.contactTick;
  const follow = action.followTick ?? Math.max(time + 1, contact + 1);
  const motion = makeMotion(action.from, action.to, action.angle,
    [contact - action.approachTicks, contact, follow + action.followTicks, follow + 2 * action.followTicks], follow);
  if (action.phase === 'return') {
    const pose = action.returnFrom ?? sampleMotion(motion, contact);
    return pose.map((p, i) => mix(p, motion.start[i], (time - action.phaseTick) / action.approachTicks)) as Tips;
  }
  return sampleMotion(motion, time);
}
export interface AnimationFrame { state: State; shapes: ReadonlyMap<number, Tips> }
/** A pure projection: rules and random draws occur only in tick(). */
export function sampleAnimation(state: State, _config?: Config): AnimationFrame {
  const shapes = new Map<number, Tips>();
  for (const animal of state.animals) {
    let shape: Tips;
    if (animal.action?.type === 'travel') shape = travelShape(animal.action, state.tick);
    else if (animal.action?.type === 'divide') {
      const action = animal.action;
      const p = (state.tick - action.startTick) / action.duration;
      shape = starPoints(hexCenter(animal), animalRadius * (1 + 0.12 * Math.sin(Math.PI * p)), animal.angle);
    } else shape = starPoints(hexCenter(animal), animalRadius, animal.angle);
    let scale = 1;
    if (animal.capturedEnergy !== undefined) scale = Math.max(0, Math.min(1, animal.energy / animal.capturedEnergy));
    if (animal.recovery) {
      const r = animal.recovery, p = Math.min(1, (state.tick - r.startTick) / (r.endTick - r.startTick));
      scale = r.scale + (1 - r.scale) * p;
    }
    if (scale !== 1) {
      const center = hexCenter(animal);
      shape = shape.map(p => [center[0] + (p[0] - center[0]) * scale, center[1] + (p[1] - center[1]) * scale]) as Tips;
    }
    shapes.set(animal.id, shape);
  }
  return { state, shapes };
}
