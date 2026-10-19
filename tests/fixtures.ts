import { defaultConfig, type Config } from '../src/config';
import type { Animal, State } from '../src/simulation';

export const testConfig: Config = { ...defaultConfig, width: 5, height: 4, grassMax: 10, grassGrowthPerSecond: 1,
  herbivore: { ...defaultConfig.herbivore, initialCount: 0 },
  carnivore: { ...defaultConfig.carnivore, initialCount: 0, energyDrainPerSecond: 2 } };
export const resident = (id: number, column: number, row: number, energy = 5, species: Animal['species'] = 'herbivore'): Animal =>
  ({ id, column, row, energy, species, angle: -Math.PI / 2, readyAt: 0 });
export const testState = (animals: Animal[], grass = 0, config = testConfig): State =>
  ({ tick: 0, animals, grass: Array(config.width * config.height).fill(grass), nextId: 100, reservations: {}, released: {} });
export function seededRandom(seed = 37): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function advance(state: State, config: Config, count: number, random: () => number = () => 0): State {
  for (let i = 0; i < count; i++) state = tick(state, config, random);
  return state;
}
import { tick } from '../src/simulation';

export const fastConfig = { ...testConfig, width: 5, height: 1, grassGrowthPerSecond: 0,
  approachTicks: 2, followTicks: 2, waitTicks: 5, swellTicks: 2, divisionApproachTicks: 2, divisionFollowTicks: 1,
  energyTransferPerSecond: 60,
  herbivore: { ...testConfig.herbivore, energyDrainPerSecond: 0.000001 },
  carnivore: { ...testConfig.carnivore, energyDrainPerSecond: 0.000001 } };
