import { defaultConfig, type Config } from './config';
import { copyConfig } from './settings';
import { parseSettings, serializeSettings } from './settings-format';
import { ApplicationError } from './errors';

export const settingsKey = 'carnivore-sim.settings';
export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageProvider = () => SettingsStorage;
const browserStorage: StorageProvider = () => window.localStorage;
export interface LoadedSettings { config: Config; saved?: Config; notice: string }

export function loadSettings(storage: StorageProvider = browserStorage): LoadedSettings {
  let raw: string | null;
  try { raw = storage().getItem(settingsKey); }
  catch { return { config: copyConfig(defaultConfig), notice: 'storage.unavailable' }; }
  if (raw === null) return { config: copyConfig(defaultConfig), notice: '' };
  try {
    const config = parseSettings(raw);
    return { config, saved: copyConfig(config), notice: 'storage.loaded' };
  } catch {
    return { config: copyConfig(defaultConfig), notice: 'storage.invalid' };
  }
}
export function saveSettings(config: Config, storage: StorageProvider = browserStorage): void {
  const text = serializeSettings(config);
  try { storage().setItem(settingsKey, text); }
  catch { throw new ApplicationError('storage'); }
}
