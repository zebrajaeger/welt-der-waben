import { hexCenter, type Position } from './hex';
import type { Animal, SimulationEvent, State, Transition } from './simulation';

export type Point = [number, number];
export type Tips = [Point, Point, Point];
export const defaultAngle = -Math.PI / 2;
export const animalRadius = 0.73;
export const huntContact = 0.5;
export const huntTransferEnd = 0.65;
export interface Motion {
  animal: Animal;
  start: Tips;
  end: Tips;
  target: Point;
  leading: number;
  endAngle: number;
  timing: readonly [number, number, number, number];
  followStart: number;
}

export function starPoints(center: Point, radius = animalRadius, angle = defaultAngle): Tips {
  return [0, 1, 2].map(i => [center[0] + Math.cos(angle + i * 2 * Math.PI / 3) * radius,
    center[1] + Math.sin(angle + i * 2 * Math.PI / 3) * radius]) as Tips;
}
const distanceSquared = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

export function makeMotion(animal: Animal, to: Position, angle = defaultAngle,
  timing: Motion['timing'] = animal.species === 'herbivore' ? [0, 0.2, 0.35, 0.5] : [0.3, 0.5, 0.75, 1],
  followStart = timing[1]): Motion {
  const origin = hexCenter(animal), target = hexCenter(to);
  const start = starPoints(origin, animalRadius, angle);
  let leading = 0;
  for (let i = 1; i < 3; i++) {
    // Epsilon gives geometrical ties a stable index order despite trig rounding.
    if (distanceSquared(start[i], target) < distanceSquared(start[leading], target) - 1e-10) leading = i;
  }
  const endAngle = Math.atan2(target[1] - origin[1], target[0] - origin[0]) - leading * 2 * Math.PI / 3;
  return { animal, start, end: starPoints(target, animalRadius, endAngle), target, leading, endAngle, timing, followStart };
}

function interpolate(a: Point, b: Point, time: number, start: number, end: number): Point {
  const progress = Math.max(0, Math.min(1, (time - start) / (end - start)));
  const eased = progress * progress * (3 - 2 * progress);
  return [a[0] + (b[0] - a[0]) * eased, a[1] + (b[1] - a[1]) * eased];
}

/** Geometry is sampled from absolute normalized time, never integrated per frame. */
export function sampleMotion(motion: Motion, time: number): Tips {
  const [begin, contact, secondEnd, end] = motion.timing;
  if (time <= begin) return motion.start;
  if (time >= end) return motion.end;
  const { leading, start, target, followStart } = motion;
  return start.map((point, index): Point => {
    if (index === leading) {
      return time <= contact ? interpolate(point, target, time, begin, contact)
        : interpolate(target, motion.end[index], time, followStart, end);
    }
    const second = index === (leading + 1) % 3;
    return interpolate(point, motion.end[index], time, second ? followStart : secondEnd, second ? secondEnd : end);
  }) as Tips;
}

export interface AnimationPlan {
  transition: Transition;
  motions: ReadonlyMap<number, Motion>;
  startAngles: ReadonlyMap<number, number>;
  endAngles: ReadonlyMap<number, number>;
  divisions: ReadonlyMap<number, Division>;
  hunts: readonly Extract<SimulationEvent, { type: 'hunt' }>[];
  grazing: readonly Grazing[];
}
export interface Grazing {
  event: Extract<SimulationEvent, { type: 'graze' }>;
  start: number;
  end: number;
  accountedAt: number;
}
export interface AnimationFrame { state: State; shapes: ReadonlyMap<number, Tips> }

export interface Division {
  event: Extract<SimulationEvent, { type: 'birth' }>;
  start: number;
  end: number;
  angle: number;
  parentMotion?: Motion;
  childMotion: Motion;
}

function makeDivision(event: Division['event'], angle: number): Division {
  const start = event.animal.species === 'herbivore' ? 0.3 : 0.8;
  const end = event.animal.species === 'herbivore' ? 0.5 : 1;
  const duration = end - start, moveStart = start + duration * 0.15;
  const grazing = event.animal.species === 'herbivore';
  const contact = moveStart + (end - moveStart) * 0.4;
  const followStart = grazing ? moveStart + (end - moveStart) * 0.6 : contact;
  const timing: Motion['timing'] = [moveStart, contact, (followStart + end) / 2, end];
  const { parentBefore, parentAfter, animal } = event;
  const parentMoves = parentBefore.column !== parentAfter.column || parentBefore.row !== parentAfter.row;
  return { event, start, end, angle,
    parentMotion: parentMoves ? makeMotion(parentBefore, parentAfter, angle, timing, followStart) : undefined,
    childMotion: makeMotion({ ...parentBefore, id: animal.id }, animal, angle, timing, followStart) };
}

/** First a full form swells, then two initially overlapping forms step out of it. */
export function sampleDivision(division: Division, time: number): { parent: Tips; child?: Tips; energy: number } {
  const { parentBefore, parentAfter } = division.event;
  const moveStart = division.childMotion.timing[0];
  if (time < moveStart) {
    const progress = Math.max(0, Math.min(1, (time - division.start) / (moveStart - division.start)));
    const radius = animalRadius * (1 + 0.12 * Math.sin(Math.PI * progress));
    return { parent: starPoints(hexCenter(parentBefore), radius, division.angle), energy: parentBefore.energy };
  }
  const splitEnd = parentBefore.species === 'herbivore' ? division.childMotion.timing[1] : division.end;
  const progress = Math.max(0, Math.min(1, (time - moveStart) / (splitEnd - moveStart)));
  const energy = parentBefore.energy + (parentAfter.energy - parentBefore.energy) * progress;
  return { parent: division.parentMotion ? sampleMotion(division.parentMotion, time)
    : starPoints(hexCenter(parentAfter), animalRadius, division.angle),
    child: sampleMotion(division.childMotion, time), energy };
}

/** Plans contain resolved actions only. Surviving identities retain their orientation. */
export function planAnimation(recorded: Transition, angles: ReadonlyMap<number, number> = new Map()): AnimationPlan {
  const motions = new Map<number, Motion>();
  const births = recorded.events.filter((event): event is Division['event'] => event.type === 'birth');
  const dividing = new Set(births.map(event => event.parentId));
  for (const event of recorded.events) {
    if (event.type !== 'move' && event.type !== 'hunt') continue;
    const to = event.type === 'move' ? event.to : event.prey;
    const end = event.type === 'hunt' ? dividing.has(event.animal.id) ? 0.8 : 1
      : dividing.has(event.animal.id) ? 0.3 : 0.5;
    const timing: Motion['timing'] = event.type === 'hunt'
      ? [0.3, huntContact, (huntTransferEnd + end) / 2, end]
      : [0, end * 0.4, end * 0.8, end];
    motions.set(event.animal.id, makeMotion(event.animal, to, angles.get(event.animal.id), timing,
      event.type === 'hunt' ? huntTransferEnd : end * 0.6));
  }
  const divisions = new Map<number, Division>();
  const divisionAngles = new Map<number, number>();
  for (const event of births) {
    const angle = motions.get(event.parentId)?.endAngle ?? angles.get(event.parentId) ?? defaultAngle;
    const division = makeDivision(event, angle);
    divisions.set(event.parentId, division);
    divisions.set(event.animal.id, division);
    divisionAngles.set(event.parentId, division.parentMotion?.endAngle ?? angle);
    divisionAngles.set(event.animal.id, division.childMotion.endAngle);
  }
  const endAngles = new Map(recorded.after.animals.map(animal => [animal.id,
    divisionAngles.get(animal.id) ?? motions.get(animal.id)?.endAngle ?? angles.get(animal.id) ?? defaultAngle]));
  const hunts = recorded.events.filter((event): event is Extract<SimulationEvent, { type: 'hunt' }> => event.type === 'hunt');
  const grazing: Grazing[] = [];
  for (const event of recorded.events) {
    if (event.type !== 'graze') continue;
    const division = divisions.get(event.animal.id);
    const motion = event.afterDivision && division
      ? event.animal.id === division.event.parentId ? division.parentMotion : division.childMotion
      : motions.get(event.animal.id);
    grazing.push({ event, start: motion?.timing[1] ?? 0.2, end: motion?.followStart ?? 0.3,
      accountedAt: event.afterDivision ? division!.end : dividing.has(event.animal.id) ? 0.3 : huntContact });
  }
  return { transition: recorded, motions, startAngles: new Map(angles), endAngles, divisions, hunts, grazing };
}

export function restFrame(state: State, angles: ReadonlyMap<number, number> = new Map()): AnimationFrame {
  return { state, shapes: new Map(state.animals.map(animal => [animal.id,
    starPoints(hexCenter(animal), animalRadius, angles.get(animal.id))])) };
}

/** Contact starts transfer; only visible copies change until carnivore accounting at t=1. */
export function sampleAnimation(plan: AnimationPlan, time: number): AnimationFrame {
  const { transition: recorded } = plan;
  const phase = time >= 1 ? recorded.after : time >= huntContact ? recorded.hunted : recorded.grown;
  let animals = [...phase.animals];
  let grass = phase.grass;
  for (const division of new Set(plan.divisions.values())) {
    if (time < division.start || time >= division.end) continue;
    const { parentAfter, animal } = division.event;
    const pose = sampleDivision(division, time);
    animals = animals.filter(a => a.id !== parentAfter.id && a.id !== animal.id);
    animals.push({ ...parentAfter, energy: pose.energy });
    if (pose.child) animals.push({ ...animal, energy: pose.energy });
    if (animal.species === 'herbivore') {
      if (grass === phase.grass) grass = [...grass];
      grass[division.event.sourceCell] = recorded.fed.grass[division.event.sourceCell];
    }
  }
  for (const { event, start, end, accountedAt } of plan.grazing) {
    if (time >= accountedAt || time < start) continue;
    const progress = Math.max(0, Math.min(1, (time - start) / (end - start)));
    if (grass === phase.grass) grass = [...grass];
    grass[event.cell] = event.grass * (1 - progress);
    animals = animals.map(animal => animal.id === event.animal.id
      ? { ...animal, energy: event.animal.energy + (event.energyAfter - event.animal.energy) * progress } : animal);
  }
  const transferring = time >= huntContact && time < huntTransferEnd;
  const remaining = 1 - (time - huntContact) / (huntTransferEnd - huntContact);
  if (transferring) {
    const energies = new Map(plan.hunts.map(event => [event.animal.id,
      event.energyAfter - (event.energyAfter - event.animal.energy) * remaining]));
    animals = animals.map(animal => energies.has(animal.id) ? { ...animal, energy: energies.get(animal.id)! } : animal);
    for (const { prey } of plan.hunts) animals.push({ ...prey, energy: prey.energy * remaining });
  }
  const state = { ...phase, animals, grass };
  const shapes = new Map<number, Tips>();
  for (const animal of state.animals) {
    const division = plan.divisions.get(animal.id);
    if (division && time >= division.start) {
      const pose = sampleDivision(division, time);
      shapes.set(animal.id, animal.id === division.event.parentId ? pose.parent : pose.child!);
      continue;
    }
    const motion = plan.motions.get(animal.id);
    shapes.set(animal.id, motion ? sampleMotion(motion, time)
      : starPoints(hexCenter(animal), animalRadius, plan.startAngles.get(animal.id)));
  }
  if (transferring) for (const { prey } of plan.hunts) {
    const center = hexCenter(prey);
    shapes.set(prey.id, shapes.get(prey.id)!.map(point => [
      center[0] + (point[0] - center[0]) * remaining,
      center[1] + (point[1] - center[1]) * remaining,
    ]) as Tips);
  }
  return { state, shapes };
}
