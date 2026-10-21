import { describe, expect, it, vi } from 'vitest';
import { ApplicationError } from '../src/errors';
import { errorMessage } from '../src/error-message';
import { createLocalization } from '../src/i18n';
import { defaultConfig, validateConfig } from '../src/config';
import { readSettings, settingValue, SettingError } from '../src/settings';
import { parseSettings } from '../src/settings-format';
import { loadSettings, saveSettings } from '../src/settings-storage';

describe('structured user errors', () => {
  it('preserves validation code, field path and limit separately from translated messages', () => {
    try {
      readSettings(path => path === 'width' ? '0' : String(settingValue(defaultConfig, path)));
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(SettingError);
      expect(error).toMatchObject({ code: 'integer', path: 'width', parameters: { min: 1 } });
      expect(errorMessage(error, createLocalization(['en']))).toBe('Field and food: Columns must be an integer ≥ 1.');
      expect(errorMessage(error, createLocalization(['de']))).toBe('Feld und Nahrung: Spalten muss eine ganze Zahl >= 1 sein.');
    }
  });
  it('keeps non-field constraints and import errors structured', () => {
    for (const [operation, code] of [
      [() => validateConfig({ ...defaultConfig, width: 1, height: 1 }), 'population'],
      [() => validateConfig({ ...defaultConfig, grassGrowthPerSecond: 2 }), 'growth'],
      [() => parseSettings('{'), 'json'], [() => parseSettings('{"version":3}'), 'version'],
    ] as const) {
      try { operation(); expect.unreachable(); }
      catch (error) { expect(error).toBeInstanceOf(ApplicationError); expect(error).toMatchObject({ code }); }
    }
  });
  it('returns a notice key and preserves failure codes for inaccessible storage', () => {
    const denied = () => { throw new Error('denied'); };
    expect(loadSettings(denied)).toMatchObject({ notice: 'storage.unavailable', config: defaultConfig });
    try { saveSettings(defaultConfig, denied); expect.unreachable(); }
    catch (error) { expect(error).toMatchObject({ code: 'storage' }); }
  });
  it('shows a localized generic message for an unknown cause and logs its details', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const error = new Error('internal details');
      expect(errorMessage(error, createLocalization())).toBe('The operation could not be completed. Please try again.');
      expect(log).toHaveBeenCalledWith(error);
    } finally { log.mockRestore(); }
  });
});
