import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/config';
import { copyConfig, decodeSettings, readSettings, sameSettings, settingFields, settingValue } from '../src/settings';

describe('settings drafts', () => {
  it('covers every numeric leaf, reads it and isolates both species from defaults', () => {
    const paths = Object.entries(defaultConfig).flatMap(([key, value]) => typeof value === 'number' ? [key] : Object.keys(value).map(child => `${key}.${child}`));
    expect(settingFields.map(field => field.path).sort()).toEqual(paths.sort());
    const config = readSettings(path => String(settingValue(defaultConfig, path)));
    expect(config).toEqual(defaultConfig);
    config.herbivore.maxEnergy = 40;
    config.carnivore.initialCount = 2;
    expect(defaultConfig.herbivore.maxEnergy).toBe(20);
    expect(defaultConfig.carnivore.initialCount).toBe(10);
    expect(sameSettings(config, defaultConfig)).toBe(false);
  });
  it('rejects empty, nonfinite, fractional and out of range inputs with field labels', () => {
    for (const input of ['', ' ', 'NaN', 'Infinity', 'abc', '0', '-1', '1.5']) {
      expect(() => readSettings(path => path === 'width' ? input : String(settingValue(defaultConfig, path)))).toThrow(/width/);
    }
    expect(() => readSettings(path => path === 'herbivore.divisionFraction' ? '1' : String(settingValue(defaultConfig, path)))).toThrow(/herbivore.divisionFraction/);
  });
  it('keeps domain constraints for drafts and stored data', () => {
    for (const config of [{ ...defaultConfig, width: 1, height: 1 }, { ...defaultConfig, grassGrowthPerSecond: 2 }]) {
      expect(() => decodeSettings(config)).toThrow();
      expect(() => readSettings(path => String(settingValue(config, path)))).toThrow();
    }
  });
  it('requires every stored leaf to be numeric, and strips unknown fields', () => {
    for (const field of settingFields) {
      for (const invalid of [undefined, null, '2', false, {}, NaN, Infinity]) {
        const config: Record<string, unknown> = { ...copyConfig(defaultConfig) };
        const [parent, child] = field.path.split('.');
        if (child) (config[parent] as Record<string, unknown>)[child] = invalid;
        else config[parent] = invalid;
        expect(() => decodeSettings(config)).toThrow();
      }
    }
    expect(decodeSettings({ ...defaultConfig, extra: 99 })).toEqual(defaultConfig);
    for (const value of [null, [], {}, { ...defaultConfig, herbivore: null }]) expect(() => decodeSettings(value)).toThrow();
  });
});
