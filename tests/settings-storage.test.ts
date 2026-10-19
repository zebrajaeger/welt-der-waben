import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/config';
import { copyConfig } from '../src/settings';
import { loadSettings, saveSettings, settingsKey, type SettingsStorage } from '../src/settings-storage';

describe('local settings storage', () => {
  const memory = () => {
    const data = new Map<string, string>([['other-app', 'untouched']]);
    const storage: SettingsStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); } };
    return { data, storage: () => storage };
  };
  it('uses defaults on first visit and roundtrips only settings without aliasing', () => {
    const { data, storage } = memory();
    expect(loadSettings(storage)).toEqual({ config: defaultConfig, notice: '' });
    const config = copyConfig(defaultConfig); config.herbivore.maxEnergy = 42; config.speedMultiplier = 3;
    config.herbivore.initialEnergy = 7.5; config.carnivore.initialEnergy = 18;
    saveSettings(config, storage);
    const loaded = loadSettings(storage);
    expect(loaded.config).toEqual(config); expect(loaded.saved).toEqual(config);
    loaded.config.herbivore.maxEnergy = 9;
    expect(loaded.saved?.herbivore.maxEnergy).toBe(42);
    expect(data.get('other-app')).toBe('untouched');
    expect(Object.keys(JSON.parse(data.get(settingsKey)!))).toEqual(['version', 'config']);
  });
  it('rejects all malformed, incompatible, missing and invalid data as a whole', () => {
    const { data, storage } = memory();
    for (const raw of ['{', 'null', '{}', JSON.stringify({ version: 3, config: defaultConfig }), JSON.stringify({ version: 2, config: {} }), JSON.stringify({ version: 2, config: { ...defaultConfig, grassGrowthPerSecond: 2 } })]) {
      data.set(settingsKey, raw);
      const loaded = loadSettings(storage);
      expect(loaded.config).toEqual(defaultConfig); expect(loaded.saved).toBeUndefined();
      expect(loaded.notice).toMatch(/ungültig/); expect(data.get(settingsKey)).toBe(raw);
    }
  });
  it('loads version 1 with its former start energy without losing other parameters', () => {
    const { data, storage } = memory();
    const config = copyConfig(defaultConfig);
    config.width = 16; config.carnivore.maxEnergy = 40;
    const legacy = { ...config,
      herbivore: { initialCount: 5, maxEnergy: 12, energyDrainPerSecond: 2, divisionFraction: 0.75 },
      carnivore: { initialCount: 3, maxEnergy: 40, energyDrainPerSecond: 2, divisionFraction: 0.75 } };
    const raw = JSON.stringify({ version: 1, config: legacy }); data.set(settingsKey, raw);
    const loaded = loadSettings(storage);
    expect(loaded.config.width).toBe(16);
    expect(loaded.config.herbivore).toEqual({ ...legacy.herbivore, initialEnergy: 6 });
    expect(loaded.config.carnivore).toEqual({ ...legacy.carnivore, initialEnergy: 20 });
    expect(data.get(settingsKey)).toBe(raw);
    saveSettings(loaded.config, storage);
    expect(JSON.parse(data.get(settingsKey)!).version).toBe(2);
    data.set(settingsKey, JSON.stringify({ version: 2, config: legacy }));
    expect(loadSettings(storage).notice).toMatch(/ungültig/);
  });
  it('handles throwing access, reads and writes and preserves the last successful save', () => {
    const inaccessible = () => { throw new Error('denied'); };
    const unreadable = () => ({ getItem() { throw new Error('denied'); }, setItem() {} });
    for (const storage of [inaccessible, unreadable]) expect(loadSettings(storage).notice).toMatch(/nicht verfügbar/);
    expect(() => saveSettings(defaultConfig, inaccessible)).toThrow(/nicht.*gespeichert/);
    const { data, storage } = memory(); saveSettings(defaultConfig, storage);
    const previous = data.get(settingsKey);
    expect(() => saveSettings(defaultConfig, () => ({ getItem: storage().getItem, setItem() { throw new Error('quota'); } }))).toThrow(/nicht.*gespeichert/);
    expect(data.get(settingsKey)).toBe(previous);
    expect(() => saveSettings({ ...defaultConfig, width: 0 }, storage)).toThrow();
    expect(data.get(settingsKey)).toBe(previous);
  });
});
