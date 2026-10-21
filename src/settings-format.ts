import type { Config } from './config';
import { decodeSettings } from './settings';
import { ApplicationError } from './errors';

/** The same portable record is used by local storage and settings files. */
export function serializeSettings(config: Config): string {
  return `${JSON.stringify({ version: 2, config: decodeSettings(config) }, null, 2)}\n`;
}

export function parseSettings(text: string): Config {
  let record;
  try { record = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new ApplicationError('json'); }
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new ApplicationError('record');
  if (record.version !== 1 && record.version !== 2) throw new ApplicationError('version');
  let config = record.config;
  if (record.version === 1) {
    // Version 1 always started animals at half their maximum energy.
    config = { ...config };
    for (const species of ['herbivore', 'carnivore']) {
      const original = config[species];
      if (!original || typeof original.maxEnergy !== 'number') throw new ApplicationError('species');
      config[species] = { ...original, initialEnergy: original.maxEnergy / 2 };
    }
  }
  return decodeSettings(config);
}
