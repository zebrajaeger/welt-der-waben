import { defaultConfig, validateConfig, type Config, type SpeciesConfig } from './config';
import { ApplicationError, type ErrorCode } from './errors';

type Species = 'herbivore' | 'carnivore';
type ScalarKey = Exclude<keyof Config, Species>;
export type SettingPath = ScalarKey | `${Species}.${keyof SpeciesConfig}`;
interface SettingField {
  path: SettingPath;
  label: string;
  group: string;
  min: number;
  integer?: boolean;
  max?: number;
}
export const settingFields: readonly SettingField[] = [
  { path: 'width', label: 'fields.width', group: 'groups.world', min: 1, integer: true },
  { path: 'height', label: 'fields.height', group: 'groups.world', min: 1, integer: true },
  { path: 'grassMax', label: 'fields.grassMax', group: 'groups.world', min: 0 },
  { path: 'grassGrowthPerSecond', label: 'fields.grassGrowthPerSecond', group: 'groups.world', min: 0 },
  { path: 'grassEfficiency', label: 'fields.grassEfficiency', group: 'groups.world', min: 0 },
  { path: 'preyEfficiency', label: 'fields.preyEfficiency', group: 'groups.world', min: 0 },
  { path: 'energyTransferPerSecond', label: 'fields.energyTransferPerSecond', group: 'groups.world', min: 0 },
  { path: 'speedMultiplier', label: 'fields.speedMultiplier', group: 'groups.world', min: 0 },
  ...(['herbivore', 'carnivore'] as const).flatMap(species => [
    { path: `${species}.initialCount` as const, label: 'fields.initialCount', group: species === 'herbivore' ? 'groups.herbivore' : 'groups.carnivore', min: 0, integer: true },
    { path: `${species}.initialEnergy` as const, label: 'fields.initialEnergy', group: species === 'herbivore' ? 'groups.herbivore' : 'groups.carnivore', min: 0 },
    { path: `${species}.maxEnergy` as const, label: 'fields.maxEnergy', group: species === 'herbivore' ? 'groups.herbivore' : 'groups.carnivore', min: 0 },
    { path: `${species}.energyDrainPerSecond` as const, label: 'fields.energyDrainPerSecond', group: species === 'herbivore' ? 'groups.herbivore' : 'groups.carnivore', min: 0 },
    { path: `${species}.divisionFraction` as const, label: 'fields.divisionFraction', group: species === 'herbivore' ? 'groups.herbivore' : 'groups.carnivore', min: 0, max: 1 },
  ]),
  ...(['approachTicks', 'followTicks', 'waitTicks', 'swellTicks', 'divisionApproachTicks', 'divisionFollowTicks'] as const)
    .map(path => ({ path, label: `fields.${path}`, group: 'groups.actions', min: 1, integer: true })),
];

export function copyConfig(config: Config): Config {
  return { ...config, herbivore: { ...config.herbivore }, carnivore: { ...config.carnivore } };
}
export function settingValue(config: Config, path: SettingPath): number {
  if (!path.includes('.')) return config[path as ScalarKey];
  const [species, key] = path.split('.') as [Species, keyof SpeciesConfig];
  return config[species][key];
}
function setValue(config: Config, path: SettingPath, value: number): void {
  if (!path.includes('.')) config[path as ScalarKey] = value;
  else {
    const [species, key] = path.split('.') as [Species, keyof SpeciesConfig];
    config[species][key] = value;
  }
}
export class SettingError extends ApplicationError {
  declare readonly path?: SettingPath;
  constructor(code: ErrorCode, path?: SettingPath, parameters: Record<string, string | number> = {}) { super(code, parameters, path); }
}
function validateSettings(config: Config): Config {
  try { validateConfig(config); }
  catch (error) {
    if (!(error instanceof ApplicationError)) throw error;
    const field = settingFields.find(field => field.path === error.path);
    throw new SettingError(error.code, field?.path, error.parameters);
  }
  return config;
}
export function readSettings(read: (path: SettingPath) => string): Config {
  const config = copyConfig(defaultConfig);
  for (const field of settingFields) {
    const input = read(field.path).trim();
    const value = input === '' ? NaN : Number(input);
    if (!Number.isFinite(value)) throw new SettingError('finite', field.path);
    setValue(config, field.path, value);
  }
  return validateSettings(config);
}
export function sameSettings(a: Config, b: Config): boolean {
  return settingFields.every(field => settingValue(a, field.path) === settingValue(b, field.path));
}

/** Stored data is untrusted: require every known numeric leaf before applying domain validation. */
export function decodeSettings(value: unknown): Config {
  if (!value || typeof value !== 'object') throw new ApplicationError('missing');
  const source = value as Record<string, unknown>;
  const config = copyConfig(defaultConfig);
  for (const field of settingFields) {
    const [parent, child] = field.path.split('.');
    const branch = source[parent];
    const leaf = child && branch && typeof branch === 'object' ? (branch as Record<string, unknown>)[child] : child ? undefined : branch;
    if (typeof leaf !== 'number') throw new SettingError('type', field.path);
    setValue(config, field.path, leaf);
  }
  return validateSettings(config);
}
