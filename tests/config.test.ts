import { describe, expect, it } from 'vitest';
import { defaultConfig, ticksPerSecond, validateConfig } from '../src/config';

describe('configuration', () => {
  it('supplies the agreed defaults', () => {
    expect(ticksPerSecond).toBe(60);
    expect(defaultConfig.energyTransferPerSecond).toBe(8);
    expect([defaultConfig.width, defaultConfig.height]).toEqual([30, 20]);
    expect(defaultConfig.grassMax / 2).toBe(5);
    for (const kind of ['herbivore', 'carnivore'] as const) {
      expect(defaultConfig[kind].initialCount).toBe(10);
      expect(defaultConfig[kind].maxEnergy / 2).toBe(10);
      expect(defaultConfig[kind].initialEnergy).toBe(10);
      expect(defaultConfig[kind].divisionFraction).toBe(0.75);
    }
    expect(() => validateConfig(defaultConfig)).not.toThrow();
  });
  it('rejects crowding and parameters that let trapped grazers survive', () => {
    expect(() => validateConfig({ ...defaultConfig, width: 1, height: 1 })).toThrow(/Startpopulation/);
    expect(() => validateConfig({ ...defaultConfig, grassGrowthPerSecond: 2 })).toThrow(/Graswachstum/);
  });
  it('validates all numeric fields and their bounds', () => {
    for (const key of ['approachTicks', 'followTicks', 'waitTicks', 'swellTicks', 'divisionApproachTicks', 'divisionFollowTicks']) {
      for (const value of [0, -1, 1.5, NaN, Infinity]) expect(() => validateConfig({ ...defaultConfig, [key]: value })).toThrow();
    }
    for (const value of [0, -1, NaN, Infinity]) expect(() => validateConfig({ ...defaultConfig, energyTransferPerSecond: value })).toThrow();
    for (const [key, value] of Object.entries({ width: 0, height: 1.5, grassMax: -1, grassGrowthPerSecond: NaN, grassEfficiency: -1, preyEfficiency: Infinity, speedMultiplier: 0 })) {
      expect(() => validateConfig({ ...defaultConfig, [key]: value })).toThrow();
    }
    for (const kind of ['herbivore', 'carnivore'] as const) {
      for (const [key, value] of Object.entries({ initialCount: -1, maxEnergy: 0, energyDrainPerSecond: Infinity, divisionFraction: 1 })) {
        expect(() => validateConfig({ ...defaultConfig, [kind]: { ...defaultConfig[kind], [key]: value } })).toThrow();
      }
    }
    expect(() => validateConfig({ ...defaultConfig, grassGrowthPerSecond: 0, preyEfficiency: 0 })).not.toThrow();
  });
  it('rejects non-finite numbers in every field and fractional populations', () => {
    for (const key of ['width', 'height', 'grassMax', 'grassGrowthPerSecond', 'grassEfficiency', 'preyEfficiency', 'speedMultiplier']) {
      for (const value of [NaN, Infinity, -Infinity]) {
        expect(() => validateConfig({ ...defaultConfig, [key]: value })).toThrow();
      }
    }
    for (const kind of ['herbivore', 'carnivore'] as const) {
      for (const key of ['initialCount', 'initialEnergy', 'maxEnergy', 'energyDrainPerSecond', 'divisionFraction']) {
        for (const value of [NaN, Infinity, -Infinity, -1, 0]) {
          if (key === 'initialCount' && value === 0) continue;
          expect(() => validateConfig({ ...defaultConfig, [kind]: { ...defaultConfig[kind], [key]: value } })).toThrow();
        }
      }
      expect(() => validateConfig({ ...defaultConfig, [kind]: { ...defaultConfig[kind], initialCount: 0.5 } })).toThrow();
    }
    expect(() => validateConfig({ ...defaultConfig, grassGrowthPerSecond: 3 })).toThrow(/Graswachstum/);
    expect(() => validateConfig({ ...defaultConfig, width: 5, height: 4 })).not.toThrow();
  });
  it('requires positive finite start energy no larger than the species maximum', () => {
    for (const kind of ['herbivore', 'carnivore'] as const) {
      for (const initialEnergy of [0, -1, NaN, Infinity, 21]) {
        expect(() => validateConfig({ ...defaultConfig, [kind]: { ...defaultConfig[kind], initialEnergy } })).toThrow(/initialEnergy/);
      }
      expect(() => validateConfig({ ...defaultConfig, [kind]: { ...defaultConfig[kind], initialEnergy: 20 } })).not.toThrow();
    }
  });
});
