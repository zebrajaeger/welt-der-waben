export const ticksPerSecond = 60;

import { ApplicationError } from './errors';

export interface SpeciesConfig {
  initialCount: number;
  initialEnergy: number;
  maxEnergy: number;
  energyDrainPerSecond: number;
  divisionFraction: number;
}
export interface Config {
  width: number;
  height: number;
  grassMax: number;
  grassGrowthPerSecond: number;
  grassEfficiency: number;
  preyEfficiency: number;
  energyTransferPerSecond: number;
  speedMultiplier: number;
  approachTicks: number;
  followTicks: number;
  waitTicks: number;
  swellTicks: number;
  divisionApproachTicks: number;
  divisionFollowTicks: number;
  herbivore: SpeciesConfig;
  carnivore: SpeciesConfig;
}
export const defaultConfig: Config = {
  width: 30, height: 20, grassMax: 5, grassGrowthPerSecond: 0.25,
  grassEfficiency: 1, preyEfficiency: 0.5, energyTransferPerSecond: 8,
  speedMultiplier: 2, approachTicks: 12, followTicks: 6, waitTicks: 12,
  swellTicks: 6, divisionApproachTicks: 8, divisionFollowTicks: 4,
  herbivore: { initialCount: 10, initialEnergy: 10, maxEnergy: 20, energyDrainPerSecond: 2, divisionFraction: 0.75 },
  carnivore: { initialCount: 10, initialEnergy: 10, maxEnergy: 20, energyDrainPerSecond: 0.33, divisionFraction: 0.75 },
};
export function validateConfig(config: Config): void {
  const number = (value: number, name: string, min: number, strict = false) => {
    if (!Number.isFinite(value) || (strict ? value <= min : value < min)) throw new ApplicationError(strict ? 'positive' : 'minimum', { min }, name);
  };
  const integer = (value: number, name: string, min: number) => {
    if (!Number.isSafeInteger(value) || value < min) throw new ApplicationError('integer', { min }, name);
  };
  for (const key of ['width', 'height', 'approachTicks', 'followTicks', 'waitTicks', 'swellTicks', 'divisionApproachTicks', 'divisionFollowTicks'] as const) integer(config[key], key, 1);
  for (const key of ['grassMax', 'energyTransferPerSecond', 'speedMultiplier'] as const) number(config[key], key, 0, true);
  for (const key of ['grassGrowthPerSecond', 'grassEfficiency', 'preyEfficiency'] as const) number(config[key], key, 0);
  for (const kind of ['herbivore', 'carnivore'] as const) {
    const species = config[kind];
    if (!species) throw new ApplicationError('species', {}, kind);
    integer(species.initialCount, `${kind}.initialCount`, 0);
    number(species.maxEnergy, `${kind}.maxEnergy`, 0, true);
    number(species.initialEnergy, `${kind}.initialEnergy`, 0, true);
    if (species.initialEnergy > species.maxEnergy) throw new ApplicationError('initialEnergy', {}, `${kind}.initialEnergy`);
    number(species.energyDrainPerSecond, `${kind}.energyDrainPerSecond`, 0, true);
    number(species.divisionFraction, `${kind}.divisionFraction`, 0, true);
    if (species.divisionFraction >= 1) throw new ApplicationError('fraction', {}, `${kind}.divisionFraction`);
  }
  if (config.width * config.height < config.herbivore.initialCount + config.carnivore.initialCount) throw new ApplicationError('population');
  if (config.grassGrowthPerSecond * config.grassEfficiency >= config.herbivore.energyDrainPerSecond) throw new ApplicationError('growth');
}
