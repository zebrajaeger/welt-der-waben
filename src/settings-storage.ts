import { defaultConfig, type Config } from './config';
import { copyConfig, decodeSettings } from './settings';

export const settingsKey = 'carnivore-sim.settings';
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageProvider = () => SettingsStorage;
const browserStorage: StorageProvider = () => window.localStorage;
export interface LoadedSettings { config: Config; saved?: Config; notice: string }

export function loadSettings(storage: StorageProvider = browserStorage): LoadedSettings {
  let raw: string | null;
  try { raw = storage().getItem(settingsKey); }
  catch { return { config: copyConfig(defaultConfig), notice: 'Browserspeicher ist nicht verfügbar. Standardwerte sind aktiv; Einstellungen können weiterhin übernommen werden.' }; }
  if (raw === null) return { config: copyConfig(defaultConfig), notice: '' };
  try {
    const record = JSON.parse(raw);
    if (!record || ![1, 2].includes(record.version)) throw new Error('Unbekannte Version');
    let stored = record.config;
    if (record.version === 1) {
      // Version 1 had no start-energy parameter: preserve its previous half-maximum behavior.
      stored = { ...stored };
      for (const species of ['herbivore', 'carnivore']) {
        const original = stored[species];
        if (!original || typeof original.maxEnergy !== 'number') throw new Error('Artkonfiguration fehlt');
        stored[species] = { ...original, initialEnergy: original.maxEnergy / 2 };
      }
    }
    const config = decodeSettings(stored);
    return { config, saved: copyConfig(config), notice: 'Gespeicherte Einstellungen geladen.' };
  } catch {
    return { config: copyConfig(defaultConfig), notice: 'Gespeicherte Einstellungen sind ungültig oder inkompatibel. Standardwerte sind aktiv.' };
  }
}
export function saveSettings(config: Config, storage: StorageProvider = browserStorage): void {
  const checked = decodeSettings(config);
  try { storage().setItem(settingsKey, JSON.stringify({ version: 2, config: checked })); }
  catch { throw new Error('Einstellungen konnten nicht im Browser gespeichert werden. Sie können weiterhin übernommen werden.'); }
}
