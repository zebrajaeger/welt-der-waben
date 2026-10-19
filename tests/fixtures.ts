import { defaultConfig, type Config } from '../src/config';
import type { Animal, State } from '../src/simulation';

export const testConfig: Config = { ...defaultConfig, width: 5, height: 4,
  herbivore: { ...defaultConfig.herbivore, initialCount: 0 },
  carnivore: { ...defaultConfig.carnivore, initialCount: 0 } };
export const resident = (id: number, column: number, row: number, energy = 5, species: Animal['species'] = 'herbivore'): Animal =>
  ({ id, column, row, energy, species, activeFrom: 1 });
export const testState = (animals: Animal[], grass = 0, config = testConfig): State =>
  ({ step: 0, animals, grass: Array(config.width * config.height).fill(grass), nextId: 100 });
export function seededRandom(seed = 37): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function movingPrey() {
  const state = testState([resident(1, 0, 0), resident(2, 2, 0, 5, 'carnivore')]);
  state.grass[1] = 9;
  return state;
}
