import { catalogs, createLocalization } from './i18n';

export const languageKey = 'carnivore-sim.language';
type LanguageStorage = Pick<Storage, 'getItem' | 'setItem'>;
type StorageProvider = () => LanguageStorage;
const browserStorage: StorageProvider = () => window.localStorage;

export function preferredLocalization(preferences: readonly string[], language?: string, storage: StorageProvider = browserStorage) {
  let saved: string | null = null;
  try { saved = storage().getItem(languageKey); } catch { /* Browser preferences still work without storage. */ }
  return createLocalization(saved && Object.hasOwn(catalogs, saved) ? [saved] : preferences, language);
}

export function saveLanguage(language: string, storage: StorageProvider = browserStorage): void {
  if (!Object.hasOwn(catalogs, language)) return;
  try { storage().setItem(languageKey, language); } catch { /* Keep the selection for this visit. */ }
}
