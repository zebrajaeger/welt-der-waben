import { defaultConfig, type Config } from './config';
import { copyConfig } from './settings';
import { parseSettings, serializeSettings } from './settings-format';

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
    const config = parseSettings(raw);
    return { config, saved: copyConfig(config), notice: 'Gespeicherte Einstellungen geladen.' };
  } catch {
    return { config: copyConfig(defaultConfig), notice: 'Gespeicherte Einstellungen sind ungültig oder inkompatibel. Standardwerte sind aktiv.' };
  }
}
export function saveSettings(config: Config, storage: StorageProvider = browserStorage): void {
  const text = serializeSettings(config);
  try { storage().setItem(settingsKey, text); }
  catch { throw new Error('Einstellungen konnten nicht im Browser gespeichert werden. Sie können weiterhin übernommen werden.'); }
}
