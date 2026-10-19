import { type Config, validateConfig } from './config';
import { cellIndex, neighbors, type Position } from './hex';

export type Species = 'herbivore' | 'carnivore';
export type Random = () => number;
export interface Animal extends Position {
  id: number;
  species: Species;
  energy: number;
  activeFrom: number;
}
export interface State {
  step: number;
  grass: number[];
  animals: Animal[];
  nextId: number;
}

/** Copies describe resolved actions, never proposals. Their order follows the rule phases. */
export type SimulationEvent =
  | { type: 'move'; animal: Animal; to: Position }
  | { type: 'hunt'; animal: Animal; prey: Animal; energyAfter: number }
  | { type: 'graze'; animal: Animal; cell: number; grass: number; energyAfter: number; afterDivision: boolean }
  | { type: 'birth'; parentId: number; animal: Animal; parentBefore: Animal; parentAfter: Animal; sourceCell: number }
  | { type: 'death'; animal: Animal };
type Emit = (event: SimulationEvent) => void;
export interface Transition {
  before: State;
  grown: State;
  fed: State;
  herbivores: State;
  hunted: State;
  drained: State;
  after: State;
  events: SimulationEvent[];
}
const copyState = (state: State): State => ({ ...state, grass: [...state.grass], animals: state.animals.map(a => ({ ...a })) });

function choose<T>(values: readonly T[], random: Random): T {
  return values[Math.floor(random() * values.length)];
}

export function initialize(config: Config, random: Random = Math.random): State {
  validateConfig(config);
  const state: State = {
    step: 0, grass: Array(config.width * config.height).fill(config.grassMax / 2), animals: [], nextId: 1,
  };
  const available = state.grass.map((_, i) => i);
  for (const species of ['herbivore', 'carnivore'] as const) {
    for (let i = 0; i < config[species].initialCount; i++) {
      const slot = Math.floor(random() * available.length);
      const index = available[slot];
      available[slot] = available[available.length - 1];
      available.pop();
      state.animals.push({ id: state.nextId++, species, column: index % config.width,
        row: Math.floor(index / config.width), energy: config[species].maxEnergy / 2, activeFrom: 1 });
      if (species === 'herbivore') state.grass[index] = 0;
    }
  }
  return state;
}

export function growGrass(state: State, config: Config): void {
  state.grass = state.grass.map(grass => Math.min(config.grassMax, grass + config.grassGrowth));
}

const occupied = (state: State, config: Config) => new Set(state.animals.map(a => cellIndex(a, config.width)));
const active = (state: State, species: Species) => state.animals.filter(a => a.species === species && a.activeFrom <= state.step);

/** Choose all proposals before resolving a destination's applicants. No retries. */
function resolve<T>(proposals: Map<number, T[]>, random: Random, apply: (winner: T, target: number) => void): void {
  for (const [target, applicants] of proposals) apply(choose(applicants, random), target);
}
function propose<T>(proposals: Map<number, T[]>, target: number, applicant: T): void {
  const applicants = proposals.get(target) ?? [];
  applicants.push(applicant);
  proposals.set(target, applicants);
}

export function moveHerbivores(state: State, config: Config, random: Random, emit?: Emit): void {
  const snapshot = occupied(state, config);
  const proposals = new Map<number, Animal[]>();
  for (const animal of active(state, 'herbivore')) {
    const free = neighbors(animal, config.width, config.height).filter(p => !snapshot.has(cellIndex(p, config.width)));
    if (!free.length) continue;
    const maximum = Math.max(...free.map(p => state.grass[cellIndex(p, config.width)]));
    const best = free.filter(p => state.grass[cellIndex(p, config.width)] === maximum);
    propose(proposals, cellIndex(choose(best, random), config.width), animal);
  }
  resolve(proposals, random, (animal, target) => {
    emit?.({ type: 'move', animal: { ...animal }, to: { column: target % config.width, row: Math.floor(target / config.width) } });
    animal.column = target % config.width;
    animal.row = Math.floor(target / config.width);
  });
}

export function feedHerbivores(state: State, config: Config, emit?: Emit): void {
  for (const animal of active(state, 'herbivore')) consumeGrass(state, config, animal, emit);
  drainEnergy(state, config, 'herbivore', emit);
}

function consumeGrass(state: State, config: Config, animal: Animal, emit?: Emit, afterDivision = false): void {
  const cell = cellIndex(animal, config.width);
  const energyAfter = Math.min(config.herbivore.maxEnergy, animal.energy + state.grass[cell] * config.grassEfficiency);
  if (state.grass[cell] > 0) emit?.({ type: 'graze', animal: { ...animal }, cell, grass: state.grass[cell], energyAfter, afterDivision });
  animal.energy = energyAfter;
  state.grass[cell] = 0;
}

function drainEnergy(state: State, config: Config, species: Species, emit?: Emit): void {
  for (const animal of active(state, species)) {
    animal.energy -= config[species].energyDrain;
    if (animal.energy <= 0) emit?.({ type: 'death', animal: { ...animal } });
  }
  state.animals = state.animals.filter(a => a.energy > 0);
}

export function divide(state: State, config: Config, species: Species, random: Random, emit?: Emit): void {
  const snapshot = occupied(state, config);
  const proposals: { parent: Animal; childTarget: Position; parentTarget: Position }[] = [];
  const parameters = config[species];
  for (const parent of active(state, species)) {
    if (parent.energy <= parameters.maxEnergy * parameters.divisionFraction) continue;
    const free = neighbors(parent, config.width, config.height).filter(p => !snapshot.has(cellIndex(p, config.width)));
    if (!free.length) continue;
    const childTarget = choose(free, random);
    const remaining = free.filter(p => cellIndex(p, config.width) !== cellIndex(childTarget, config.width));
    const parentTarget = remaining.length ? choose(remaining, random) : { column: parent.column, row: parent.row };
    proposals.push({ parent, childTarget, parentTarget });
  }
  const claimed = new Set<number>();
  while (proposals.length) {
    const proposalIndex = Math.floor(random() * proposals.length);
    const { parent, childTarget, parentTarget } = proposals.splice(proposalIndex, 1)[0];
    const targets = [cellIndex(childTarget, config.width), cellIndex(parentTarget, config.width)];
    if (targets.some(target => claimed.has(target))) continue;
    targets.forEach(target => claimed.add(target));
    const parentBefore = { ...parent };
    parent.energy /= 2;
    parent.column = parentTarget.column;
    parent.row = parentTarget.row;
    const child: Animal = { id: state.nextId++, species, ...childTarget, energy: parent.energy, activeFrom: state.step + 1 };
    state.animals.push(child);
    emit?.({ type: 'birth', parentId: parent.id, animal: { ...child }, parentBefore, parentAfter: { ...parent }, sourceCell: cellIndex(parentBefore, config.width) });
    if (species === 'herbivore') {
      if (parent.column !== parentBefore.column || parent.row !== parentBefore.row) consumeGrass(state, config, parent, emit, true);
      consumeGrass(state, config, child, emit, true);
    }
  }
}

export function hunt(state: State, config: Config, random: Random, emit?: Emit): void {
  const preyByCell = new Map(state.animals.filter(a => a.species === 'herbivore').map(a => [cellIndex(a, config.width), a]));
  const proposals = new Map<number, Animal[]>();
  for (const predator of active(state, 'carnivore')) {
    const prey = neighbors(predator, config.width, config.height)
      .map(p => preyByCell.get(cellIndex(p, config.width))).filter((a): a is Animal => a !== undefined);
    if (prey.length) propose(proposals, cellIndex(choose(prey, random), config.width), predator);
  }
  const eaten = new Set<number>();
  resolve(proposals, random, (predator, target) => {
    const prey = preyByCell.get(target)!;
    const energyAfter = Math.min(config.carnivore.maxEnergy, predator.energy + prey.energy * config.preyEfficiency);
    emit?.({ type: 'hunt', animal: { ...predator }, prey: { ...prey }, energyAfter });
    predator.energy = energyAfter;
    predator.column = prey.column;
    predator.row = prey.row;
    eaten.add(prey.id);
  });
  state.animals = state.animals.filter(a => !eaten.has(a.id));
}

export function herbivorePhase(state: State, config: Config, random: Random, emit?: Emit): void {
  moveHerbivores(state, config, random, emit);
  feedHerbivores(state, config, emit);
  divide(state, config, 'herbivore', random, emit);
}
export function carnivorePhase(state: State, config: Config, random: Random, emit?: Emit): void {
  hunt(state, config, random, emit);
  finishCarnivores(state, config, random, emit);
}

function finishCarnivores(state: State, config: Config, random: Random, emit?: Emit): void {
  drainEnergy(state, config, 'carnivore', emit);
  divide(state, config, 'carnivore', random, emit);
}

type Capture = (phase: 'grown' | 'fed' | 'herbivores' | 'hunted' | 'drained', state: State) => void;
function evolve(state: State, config: Config, random: Random, emit?: Emit, capture?: Capture): State {
  const next = copyState(state);
  next.step++;
  growGrass(next, config);
  capture?.('grown', next);
  moveHerbivores(next, config, random, emit);
  feedHerbivores(next, config, emit);
  capture?.('fed', next);
  divide(next, config, 'herbivore', random, emit);
  capture?.('herbivores', next);
  hunt(next, config, random, emit);
  capture?.('hunted', next);
  drainEnergy(next, config, 'carnivore', emit);
  capture?.('drained', next);
  divide(next, config, 'carnivore', random, emit);
  return next;
}

/** A pure transition: input state and configuration are left untouched. */
export function step(state: State, config: Config, random: Random = Math.random): State {
  return evolve(state, config, random);
}

/** Same calculation and random draws as step; phase snapshots and event payloads are independent copies. */
export function transition(state: State, config: Config, random: Random = Math.random): Transition {
  const snapshots = {} as Pick<Transition, 'grown' | 'fed' | 'herbivores' | 'hunted' | 'drained'>;
  const events: SimulationEvent[] = [];
  const after = evolve(state, config, random, event => events.push(event), (phase, current) => { snapshots[phase] = copyState(current); });
  return { before: copyState(state), ...snapshots, after, events };
}
