export interface SpeciesConfig {
  initialCount: number;
  maxEnergy: number;
  energyDrain: number;
  divisionFraction: number;
}

export interface Config {
  width: number;
  height: number;
  grassMax: number;
  grassGrowth: number;
  grassEfficiency: number;
  preyEfficiency: number;
  stepsPerSecond: number;
  herbivore: SpeciesConfig;
  carnivore: SpeciesConfig;
}

export const defaultConfig: Config = {
  width: 30,
  height: 20,
  grassMax: 10,
  grassGrowth: 1,
  grassEfficiency: 1,
  preyEfficiency: 0.5,
  stepsPerSecond: 2,
  herbivore: { initialCount: 10, maxEnergy: 20, energyDrain: 2, divisionFraction: 0.75 },
  carnivore: { initialCount: 10, maxEnergy: 20, energyDrain: 2, divisionFraction: 0.75 },
};

/** Throws a descriptive error for an invalid runtime configuration. */
export function validateConfig(config: Config): void {
  const integer = (value: number, name: string, min: number) => {
    if (!Number.isSafeInteger(value) || value < min) throw new Error(`${name} muss eine ganze Zahl >= ${min} sein`);
  };
  const number = (value: number, name: string, min: number, strict = false) => {
    if (!Number.isFinite(value) || (strict ? value <= min : value < min)) {
      throw new Error(`${name} muss eine endliche Zahl ${strict ? '>' : '>='} ${min} sein`);
    }
  };
  integer(config.width, 'width', 1);
  integer(config.height, 'height', 1);
  number(config.grassMax, 'grassMax', 0, true);
  number(config.grassGrowth, 'grassGrowth', 0);
  number(config.grassEfficiency, 'grassEfficiency', 0);
  number(config.preyEfficiency, 'preyEfficiency', 0);
  number(config.stepsPerSecond, 'stepsPerSecond', 0, true);
  for (const kind of ['herbivore', 'carnivore'] as const) {
    const species = config[kind];
    if (!species) throw new Error(`${kind} fehlt`);
    integer(species.initialCount, `${kind}.initialCount`, 0);
    number(species.maxEnergy, `${kind}.maxEnergy`, 0, true);
    number(species.energyDrain, `${kind}.energyDrain`, 0, true);
    number(species.divisionFraction, `${kind}.divisionFraction`, 0, true);
    if (species.divisionFraction >= 1) throw new Error(`${kind}.divisionFraction muss < 1 sein`);
  }
  if (config.width * config.height < config.herbivore.initialCount + config.carnivore.initialCount) {
    throw new Error('Startpopulation übersteigt die verfügbare Zellenzahl');
  }
  if (config.grassGrowth * config.grassEfficiency >= config.herbivore.energyDrain) {
    throw new Error('Graswachstum mal Graswirkungsgrad muss kleiner als der Grasfresser-Energieverbrauch sein');
  }
}
