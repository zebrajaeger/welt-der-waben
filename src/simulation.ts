import { ticksPerSecond, validateConfig, type Config } from './config';
import { cellIndex, neighbors, type Position } from './hex';
import { defaultAngle, makeMotion, travelShape, type Tips } from './animation';

export type Species = 'herbivore' | 'carnivore';
export type Random = () => number;
export interface TravelAction {
  type: 'travel'; kind: 'graze' | 'hunt' | 'division';
  phase: 'approach' | 'transfer' | 'follow' | 'return';
  from: Position; to: Position; angle: number;
  startTick: number; phaseTick: number; contactTick: number;
  approachTicks: number; followTicks: number; expectedEndTick: number;
  followTick?: number; preyId?: number;
  budget: number; transferred: number; sourceEnergy?: number;
  returnFrom?: Tips;
}
export interface DivideAction {
  type: 'divide'; startTick: number; duration: number; targets: Position[];
}
export interface Animal extends Position {
  id: number; species: Species; energy: number; angle: number; readyAt: number;
  action?: TravelAction | DivideAction;
  capturedBy?: number; capturedEnergy?: number;
  recovery?: { startTick: number; endTick: number; scale: number };
}
export interface State {
  tick: number; grass: number[]; animals: Animal[]; nextId: number;
  reservations: Record<number, number[]>;
  released: Record<number, number>;
}
const epsilon = 1e-10;
const position = (animal: Position): Position => ({ column: animal.column, row: animal.row });
const same = (a: Position, b: Position) => a.column === b.column && a.row === b.row;
const choose = <T>(values: readonly T[], random: Random): T => values[Math.floor(random() * values.length)];
const shuffled = <T>(values: T[], random: Random): T[] => {
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)); [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
};
function copyState(state: State): State {
  return { ...state, grass: [...state.grass], reservations: Object.fromEntries(Object.entries(state.reservations).map(([k, owners]) => [k, [...owners]])),
    released: {}, animals: state.animals.map(a => ({ ...a, recovery: a.recovery && { ...a.recovery },
      action: a.action && (a.action.type === 'divide' ? { ...a.action, targets: a.action.targets.map(position) }
        : { ...a.action, from: position(a.action.from), to: position(a.action.to) }) })) };
}
export function initialize(config: Config, random: Random = Math.random): State {
  validateConfig(config);
  const state: State = { tick: 0, nextId: 1, animals: [], grass: Array(config.width * config.height).fill(config.grassMax / 2), reservations: {}, released: {} };
  const available = state.grass.map((_, i) => i);
  for (const species of ['herbivore', 'carnivore'] as const) for (let i = 0; i < config[species].initialCount; i++) {
    const slot = Math.floor(random() * available.length), index = available[slot];
    available[slot] = available[available.length - 1]; available.pop();
    state.animals.push({ id: state.nextId++, species, column: index % config.width, row: Math.floor(index / config.width),
      energy: config[species].maxEnergy / 2, angle: defaultAngle, readyAt: Math.floor(random() * config.waitTicks) });
    if (species === 'herbivore') state.grass[index] = 0;
  }
  return state;
}
function releaseCells(state: State, id: number): void {
  for (const [key, owners] of Object.entries(state.reservations)) {
    if (!owners.includes(id)) continue;
    const remaining = owners.filter(owner => owner !== id);
    if (remaining.length) state.reservations[Number(key)] = remaining;
    else { delete state.reservations[Number(key)]; state.released[Number(key)] = state.tick; }
  }
}
function releasePrey(prey: Animal, state: State, config: Config): void {
  if (prey.capturedEnergy !== undefined) prey.recovery = { startTick: state.tick, endTick: state.tick + config.approachTicks,
    scale: Math.max(0, Math.min(1, prey.energy / prey.capturedEnergy)) };
  delete prey.capturedBy; delete prey.capturedEnergy;
  prey.readyAt = Math.max(prey.readyAt, state.tick + config.waitTicks);
}
function removeDead(state: State, config: Config): void {
  const dead = state.animals.filter(a => a.energy <= epsilon);
  for (const animal of dead) {
    releaseCells(state, animal.id); state.released[cellIndex(animal, config.width)] = state.tick;
    for (const prey of state.animals) if (prey.capturedBy === animal.id) releasePrey(prey, state, config);
  }
  if (dead.length) state.animals = state.animals.filter(a => a.energy > epsilon);
}
function finishTravel(state: State, animal: Animal, config: Config): void {
  const action = animal.action;
  if (action?.type !== 'travel') return;
  if (action.phase !== 'return') {
    if (!same(action.from, action.to)) animal.angle = makeMotion(action.from, action.to, action.angle).endAngle;
    if (!same(animal, action.to)) state.released[cellIndex(animal, config.width)] = state.tick;
    animal.column = action.to.column; animal.row = action.to.row;
  }
  releaseCells(state, animal.id);
  delete animal.action; animal.readyAt = state.tick + config.waitTicks;
}
function follow(state: State, animal: Animal, config: Config, retreat = false): void {
  const action = animal.action;
  if (action?.type !== 'travel') return;
  const returnFrom = retreat ? travelShape(action, state.tick) : undefined;
  action.phase = retreat ? 'return' : 'follow'; action.phaseTick = state.tick;
  action.returnFrom = returnFrom;
  action.followTick = state.tick;
  action.expectedEndTick = state.tick + (retreat ? action.approachTicks : 2 * action.followTicks);
  if (retreat && action.preyId !== undefined) {
    const prey = state.animals.find(a => a.id === action.preyId);
    if (prey?.capturedBy === animal.id) releasePrey(prey, state, config);
  }
  if (!retreat && same(action.from, action.to)) finishTravel(state, animal, config);
}
function contact(state: State, animal: Animal, config: Config): void {
  const action = animal.action;
  if (action?.type !== 'travel') return;
  if (action.kind === 'division' && animal.species === 'carnivore') { follow(state, animal, config); return; }
  const prey = action.preyId === undefined ? undefined : state.animals.find(a => a.id === action.preyId);
  if (action.kind === 'hunt' && !prey) { follow(state, animal, config, true); return; }
  const efficiency = action.kind === 'hunt' ? config.preyEfficiency : config.grassEfficiency;
  const source = prey ? prey.energy : state.grass[cellIndex(action.to, config.width)];
  action.sourceEnergy = source;
  action.budget = Math.max(0, Math.min(source * efficiency, config[animal.species].maxEnergy - animal.energy));
  action.transferred = 0; action.phase = 'transfer'; action.phaseTick = state.tick;
  action.expectedEndTick = state.tick + Math.ceil((action.budget - epsilon) * ticksPerSecond / config.energyTransferPerSecond)
    + (same(action.from, action.to) ? 0 : 2 * action.followTicks);
  if (prey) prey.capturedEnergy = prey.energy;
  if (action.budget <= epsilon || efficiency === 0) follow(state, animal, config, action.kind === 'hunt');
}
function startTravel(state: State, animal: Animal, to: Position, config: Config, kind: TravelAction['kind'], prey?: Animal, from = position(animal)): void {
  const approachTicks = kind === 'division' ? config.divisionApproachTicks : config.approachTicks;
  const followTicks = kind === 'division' ? config.divisionFollowTicks : config.followTicks;
  const stationary = same(from, to);
  const preyArrival = prey?.action?.type === 'travel' ? prey.action.expectedEndTick : state.tick;
  const contactTick = stationary ? state.tick : Math.max(state.tick + approachTicks, preyArrival);
  const efficiency = kind === 'hunt' ? config.preyEfficiency : animal.species === 'herbivore' ? config.grassEfficiency : 0;
  const duration = contactTick - state.tick;
  const source = kind === 'hunt' ? prey!.energy : Math.min(config.grassMax,
    state.grass[cellIndex(to, config.width)] + config.grassGrowthPerSecond * duration / ticksPerSecond);
  const budget = Math.max(0, Math.min(source * efficiency,
    config[animal.species].maxEnergy - animal.energy + config[animal.species].energyDrainPerSecond * duration / ticksPerSecond));
  animal.action = { type: 'travel', kind, phase: 'approach', from: position(from), to: position(to), angle: animal.angle,
    startTick: state.tick, phaseTick: state.tick, contactTick, approachTicks, followTicks,
    expectedEndTick: contactTick + Math.max(0, Math.ceil((budget - epsilon) * ticksPerSecond / config.energyTransferPerSecond)) + (stationary ? 0 : 2 * followTicks),
    preyId: prey?.id, budget: 0, transferred: 0 };
  if (prey) prey.capturedBy = animal.id;
  if (!stationary && kind !== 'hunt') state.reservations[cellIndex(to, config.width)] = [animal.id];
  if (stationary) contact(state, animal, config);
}
function transfer(state: State, animal: Animal, config: Config): void {
  const action = animal.action;
  if (action?.type !== 'travel' || action.phase !== 'transfer') return;
  const prey = action.preyId === undefined ? undefined : state.animals.find(a => a.id === action.preyId);
  if (action.kind === 'hunt' && !prey) {
    state.reservations[cellIndex(action.to, config.width)] = [animal.id];
    follow(state, animal, config); return;
  }
  const efficiency = action.kind === 'hunt' ? config.preyEfficiency : config.grassEfficiency;
  const index = cellIndex(action.to, config.width), available = prey ? prey.energy : state.grass[index];
  const q = Math.max(0, Math.min(config.energyTransferPerSecond / ticksPerSecond,
    action.budget - action.transferred, available * efficiency, config[animal.species].maxEnergy - animal.energy));
  if (q > 0 && efficiency > 0) {
    animal.energy = Math.min(config[animal.species].maxEnergy, animal.energy + q);
    action.transferred += q;
    if (prey) prey.energy = Math.max(0, prey.energy - q / efficiency);
    else state.grass[index] = Math.max(0, state.grass[index] - q / efficiency);
  }
  if (prey && prey.energy <= epsilon) {
    removeDead(state, config);
    state.reservations[index] = [animal.id]; follow(state, animal, config);
  } else if (action.budget - action.transferred <= epsilon || q <= epsilon) follow(state, animal, config, action.kind === 'hunt');
}
function commitDivision(state: State, parent: Animal, config: Config): void {
  const action = parent.action;
  if (action?.type !== 'divide') return;
  const from = position(parent), [parentTarget, childTarget] = action.targets;
  const half = parent.energy / 2;
  parent.energy = half;
  const child: Animal = { id: state.nextId++, species: parent.species, ...childTarget, energy: half,
    angle: parent.angle, readyAt: state.tick + config.waitTicks };
  state.animals.push(child);
  parent.column = parentTarget.column; parent.row = parentTarget.row;
  releaseCells(state, parent.id);
  const moving: number[] = [];
  for (const [animal, target] of [[parent, parentTarget], [child, childTarget]] as const) {
    delete animal.action;
    if (!same(from, target)) { startTravel(state, animal, target, config, 'division', undefined, from); moving.push(animal.id); }
    else animal.readyAt = state.tick + config.waitTicks;
  }
  if (!same(parentTarget, from)) state.reservations[cellIndex(from, config.width)] = moving;
}
interface Proposal { animal: Animal; type: 'divide' | 'graze' | 'hunt'; targets: Position[]; preyId?: number }
function schedule(state: State, config: Config, random: Random, eligible: Set<number>): void {
  const occupied = new Set(state.animals.map(a => cellIndex(a, config.width)));
  const free = (p: Position) => { const i = cellIndex(p, config.width); return !occupied.has(i) && !state.reservations[i] && state.released[i] !== state.tick; };
  const proposals: Proposal[] = [];
  for (const animal of state.animals) {
    if (!eligible.has(animal.id) || animal.action || animal.capturedBy !== undefined || animal.readyAt > state.tick || animal.recovery) continue;
    const adjacent = neighbors(animal, config.width, config.height), available = adjacent.filter(free);
    if (animal.energy > config[animal.species].maxEnergy * config[animal.species].divisionFraction && available.length) {
      const first = choose(available, random), rest = available.filter(p => !same(p, first));
      proposals.push({ animal, type: 'divide', targets: [rest.length ? choose(rest, random) : position(animal), first] });
    } else if (animal.species === 'herbivore') {
      const best = Math.max(...available.map(p => state.grass[cellIndex(p, config.width)]));
      const target = available.length ? choose(available.filter(p => state.grass[cellIndex(p, config.width)] === best), random) : position(animal);
      proposals.push({ animal, type: 'graze', targets: [target] });
    } else {
      const prey = state.animals.filter(a => {
        if (a.species !== 'herbivore' || a.capturedBy !== undefined || a.recovery || a.action?.type === 'divide') return false;
        const destination = a.action?.type === 'travel' ? a.action.to : a;
        if (a.action?.type === 'travel' && a.action.expectedEndTick - state.tick < config.approachTicks) return false;
        return adjacent.some(p => same(p, destination));
      });
      if (prey.length) {
        const target = choose(prey, random);
        proposals.push({ animal, type: 'hunt', targets: [target.action?.type === 'travel' ? target.action.to : position(target)], preyId: target.id });
      } else animal.readyAt = state.tick + config.waitTicks;
    }
  }
  for (const proposal of shuffled(proposals, random)) {
    const { animal, type, targets } = proposal;
    if (animal.capturedBy !== undefined || animal.action) continue;
    if (type === 'hunt') {
      const prey = state.animals.find(a => a.id === proposal.preyId);
      const destination = prey?.action?.type === 'travel' ? prey.action.to : prey;
      if (!prey || prey.capturedBy !== undefined || prey.action?.type === 'divide' || !same(destination!, targets[0])) {
        animal.readyAt = state.tick + config.waitTicks; continue;
      }
      startTravel(state, animal, targets[0], config, 'hunt', prey);
    } else if (targets.some(p => !same(p, animal) && !free(p))) {
      animal.readyAt = state.tick + config.waitTicks;
    } else if (type === 'divide') {
      for (const target of targets) if (!same(target, animal)) state.reservations[cellIndex(target, config.width)] = [animal.id];
      animal.action = { type: 'divide', startTick: state.tick, duration: config.swellTicks, targets: targets.map(position) };
    } else startTravel(state, animal, targets[0], config, 'graze');
  }
}
/** The only state-changing clock: fixed dt, injected random source, no browser time. */
export function tick(input: State, config: Config, random: Random = Math.random): State {
  const state = copyState(input); state.tick++;
  const eligible = new Set(state.animals.map(a => a.id));
  state.grass = state.grass.map(g => Math.min(config.grassMax, g + config.grassGrowthPerSecond / ticksPerSecond));
  for (const animal of state.animals) {
    animal.energy -= config[animal.species].energyDrainPerSecond / ticksPerSecond;
    if (animal.recovery && animal.recovery.endTick <= state.tick) delete animal.recovery;
  }
  removeDead(state, config);
  for (const animal of [...state.animals]) if (animal.energy > epsilon) transfer(state, animal, config);
  for (const animal of [...state.animals]) {
    const action = animal.action;
    if (!action || animal.energy <= epsilon) continue;
    if (action.type === 'divide') {
      if (state.tick >= action.startTick + action.duration) commitDivision(state, animal, config);
      continue;
    }
    if (action.kind === 'hunt' && action.phase === 'approach') {
      const prey = state.animals.find(a => a.id === action.preyId);
      if (!prey) {
        follow(state, animal, config, true); continue;
      }
      if (prey.action?.type === 'travel') {
        action.contactTick = Math.max(action.startTick + action.approachTicks, prey.action.expectedEndTick);
        action.expectedEndTick = action.contactTick + 2 * action.followTicks;
      }
    }
    if (action.phase === 'approach' && state.tick >= action.contactTick) contact(state, animal, config);
    else if ((action.phase === 'follow' || action.phase === 'return') && state.tick >= action.expectedEndTick) finishTravel(state, animal, config);
  }
  schedule(state, config, random, eligible);
  return state;
}
/** Diagnostic invariant check, shared by long-run and browser verification. */
export function assertWorld(state: State, config: Config): void {
  const cells = new Map<number, number>(), byId = new Map(state.animals.map(a => [a.id, a])), ids = new Set(byId.keys());
  for (const animal of state.animals) {
    const cell = cellIndex(animal, config.width);
    if (cells.has(cell) || animal.column < 0 || animal.column >= config.width || animal.row < 0 || animal.row >= config.height) throw new Error('Doppelte oder ungültige Belegung');
    cells.set(cell, animal.id);
    if (!(animal.energy > 0 && animal.energy <= config[animal.species].maxEnergy + epsilon)) throw new Error('Ungültige Energie');
    if (animal.capturedBy !== undefined) {
      const hunter = byId.get(animal.capturedBy);
      if (hunter?.action?.type !== 'travel' || hunter.action.preyId !== animal.id) throw new Error('Verwaiste Beutesperre');
    }
  }
  for (const [cell, owners] of Object.entries(state.reservations)) {
    if (!owners.length || owners.some(id => !byId.get(id)?.action)) throw new Error('Verwaiste Reservierung');
    const occupant = cells.get(Number(cell));
    if (occupant !== undefined && !owners.includes(occupant)) throw new Error('Reservierung kollidiert mit Bewohner');
  }
  if (ids.size !== state.animals.length || state.grass.some(g => !Number.isFinite(g) || g < -epsilon || g > config.grassMax + epsilon)) throw new Error('Ungültiger Weltzustand');
}
