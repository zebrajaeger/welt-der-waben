import type { Config } from './config';
import { decodeSettings } from './settings';

/** The same portable record is used by local storage and settings files. */
export function serializeSettings(config: Config): string {
  return `${JSON.stringify({ version: 2, config: decodeSettings(config) }, null, 2)}\n`;
}

export function parseSettings(text: string): Config {
  let record;
  try { record = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw new Error('Die Datei enthält kein gültiges JSON.'); }
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error('Ein Einstellungsobjekt mit Version und Konfiguration wird benötigt.');
  if (record.version !== 1 && record.version !== 2) throw new Error('Die Einstellungsversion wird nicht unterstützt.');
  let config = record.config;
  if (record.version === 1) {
    // Version 1 always started animals at half their maximum energy.
    config = { ...config };
    for (const species of ['herbivore', 'carnivore']) {
      const original = config[species];
      if (!original || typeof original.maxEnergy !== 'number') throw new Error('Artkonfiguration fehlt.');
      config[species] = { ...original, initialEnergy: original.maxEnergy / 2 };
    }
  }
  return decodeSettings(config);
}
