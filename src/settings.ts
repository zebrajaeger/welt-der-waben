import { defaultConfig, validateConfig, type Config, type SpeciesConfig } from './config';

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
  { path: 'width', label: 'Spalten', group: 'Feld und Nahrung', min: 1, integer: true },
  { path: 'height', label: 'Reihen', group: 'Feld und Nahrung', min: 1, integer: true },
  { path: 'grassMax', label: 'Grasmaximum je Zelle', group: 'Feld und Nahrung', min: 0 },
  { path: 'grassGrowthPerSecond', label: 'Graswachstum je Zelle / s', group: 'Feld und Nahrung', min: 0 },
  { path: 'grassEfficiency', label: 'Graswirkungsgrad', group: 'Feld und Nahrung', min: 0 },
  { path: 'preyEfficiency', label: 'Beutewirkungsgrad', group: 'Feld und Nahrung', min: 0 },
  { path: 'energyTransferPerSecond', label: 'Energieübertragung / s', group: 'Feld und Nahrung', min: 0 },
  { path: 'speedMultiplier', label: 'Starttempo (×)', group: 'Feld und Nahrung', min: 0 },
  ...(['herbivore', 'carnivore'] as const).flatMap(species => [
    { path: `${species}.initialCount` as const, label: 'Startanzahl', group: species === 'herbivore' ? 'Grasfresser' : 'Karnivoren', min: 0, integer: true },
    { path: `${species}.initialEnergy` as const, label: 'Startenergie', group: species === 'herbivore' ? 'Grasfresser' : 'Karnivoren', min: 0 },
    { path: `${species}.maxEnergy` as const, label: 'Maximalenergie', group: species === 'herbivore' ? 'Grasfresser' : 'Karnivoren', min: 0 },
    { path: `${species}.energyDrainPerSecond` as const, label: 'Energieverbrauch / s', group: species === 'herbivore' ? 'Grasfresser' : 'Karnivoren', min: 0 },
    { path: `${species}.divisionFraction` as const, label: 'Teilungsanteil (0–1)', group: species === 'herbivore' ? 'Grasfresser' : 'Karnivoren', min: 0, max: 1 },
  ]),
  ...([
    ['approachTicks', 'Vorstrecken'], ['followTicks', 'Nachziehen je Spitze'],
    ['waitTicks', 'Warten'], ['swellTicks', 'Teilung vorbereiten'],
    ['divisionApproachTicks', 'Teilung: Vorstrecken'], ['divisionFollowTicks', 'Teilung: Nachziehen je Spitze'],
  ] as const).map(([path, label]) => ({ path, label: `${label} (Ticks)`, group: 'Aktionszeiten', min: 1, integer: true })),
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
export class SettingError extends Error {
  constructor(message: string, readonly path?: SettingPath) { super(message); }
}
function validateSettings(config: Config): Config {
  try { validateConfig(config); }
  catch (error) {
    let message = error instanceof Error ? error.message : String(error);
    const field = settingFields.find(field => message.startsWith(`${field.path} `));
    if (field) message = `${field.group}: ${field.label}${message.slice(field.path.length)}`;
    throw new SettingError(message, field?.path);
  }
  return config;
}
export function readSettings(read: (path: SettingPath) => string): Config {
  const config = copyConfig(defaultConfig);
  for (const field of settingFields) {
    const input = read(field.path).trim();
    const value = input === '' ? NaN : Number(input);
    if (!Number.isFinite(value)) throw new SettingError(`${field.group}: ${field.label} benötigt eine endliche Zahl.`, field.path);
    setValue(config, field.path, value);
  }
  return validateSettings(config);
}
export function sameSettings(a: Config, b: Config): boolean {
  return settingFields.every(field => settingValue(a, field.path) === settingValue(b, field.path));
}

/** Stored data is untrusted: require every known numeric leaf before applying domain validation. */
export function decodeSettings(value: unknown): Config {
  if (!value || typeof value !== 'object') throw new Error('Einstellungen fehlen.');
  const source = value as Record<string, unknown>;
  const config = copyConfig(defaultConfig);
  for (const field of settingFields) {
    const [parent, child] = field.path.split('.');
    const branch = source[parent];
    const leaf = child && branch && typeof branch === 'object' ? (branch as Record<string, unknown>)[child] : child ? undefined : branch;
    if (typeof leaf !== 'number') throw new Error(`${field.label} fehlt oder hat den falschen Datentyp.`);
    setValue(config, field.path, leaf);
  }
  return validateSettings(config);
}
