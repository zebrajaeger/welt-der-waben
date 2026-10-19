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

export function moveHerbivores(state: State, config: Config, random: Random): void {
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
    animal.column = target % config.width;
    animal.row = Math.floor(target / config.width);
  });
}

export function feedHerbivores(state: State, config: Config): void {
  for (const animal of active(state, 'herbivore')) {
    const cell = cellIndex(animal, config.width);
    animal.energy = Math.min(config.herbivore.maxEnergy, animal.energy + state.grass[cell] * config.grassEfficiency);
    state.grass[cell] = 0;
  }
  drainEnergy(state, config, 'herbivore');
}

function drainEnergy(state: State, config: Config, species: Species): void {
  for (const animal of active(state, species)) animal.energy -= config[species].energyDrain;
  state.animals = state.animals.filter(a => a.energy > 0);
}

export function divide(state: State, config: Config, species: Species, random: Random): void {
  const snapshot = occupied(state, config);
  const proposals = new Map<number, Animal[]>();
  const parameters = config[species];
  for (const parent of active(state, species)) {
    if (parent.energy <= parameters.maxEnergy * parameters.divisionFraction) continue;
    const free = neighbors(parent, config.width, config.height).filter(p => !snapshot.has(cellIndex(p, config.width)));
    if (free.length) propose(proposals, cellIndex(choose(free, random), config.width), parent);
  }
  resolve(proposals, random, (parent, target) => {
    parent.energy /= 2;
    state.animals.push({ id: state.nextId++, species, column: target % config.width,
      row: Math.floor(target / config.width), energy: parent.energy, activeFrom: state.step + 1 });
  });
}

export function hunt(state: State, config: Config, random: Random): void {
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
    predator.energy = Math.min(config.carnivore.maxEnergy, predator.energy + prey.energy * config.preyEfficiency);
    predator.column = prey.column;
    predator.row = prey.row;
    eaten.add(prey.id);
  });
  state.animals = state.animals.filter(a => !eaten.has(a.id));
}

export function herbivorePhase(state: State, config: Config, random: Random): void {
  moveHerbivores(state, config, random);
  feedHerbivores(state, config);
  divide(state, config, 'herbivore', random);
}
export function carnivorePhase(state: State, config: Config, random: Random): void {
  hunt(state, config, random);
  drainEnergy(state, config, 'carnivore');
  divide(state, config, 'carnivore', random);
}

/** A pure transition: input state and configuration are left untouched. */
export function step(state: State, config: Config, random: Random = Math.random): State {
  const next: State = { ...state, step: state.step + 1, grass: [...state.grass], animals: state.animals.map(a => ({ ...a })) };
  growGrass(next, config);
  herbivorePhase(next, config, random);
  carnivorePhase(next, config, random);
  return next;
}
