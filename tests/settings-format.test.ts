import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../src/config';
import { copyConfig, settingFields } from '../src/settings';
import { parseSettings, serializeSettings } from '../src/settings-format';
import englishReadme from '../README.md?raw';
import germanReadme from '../README.de.md?raw';

describe('portable settings format', () => {
  it('roundtrips every parameter as readable versioned JSON without aliases or extra data', () => {
    const config = copyConfig(defaultConfig);
    config.width = 17; config.height = 13; config.speedMultiplier = 3.25;
    config.herbivore.initialEnergy = 7.125; config.carnivore.initialEnergy = 18;
    const extended = { ...config, extra: 'discard' };
    const text = serializeSettings(extended);
    expect(text).toContain('\n  "version": 2,\n');
    expect(text.endsWith('\n')).toBe(true);
    expect(JSON.parse(text)).toEqual({ version: 2, config });
    expect(parseSettings(text)).toEqual(config);
    const first = parseSettings(text), second = parseSettings(text);
    first.herbivore.initialEnergy = 1;
    expect(second.herbivore.initialEnergy).toBe(7.125);
    expect(config.herbivore.initialEnergy).toBe(7.125);
    expect(parseSettings('\uFEFF' + text)).toEqual(config);
    expect(parseSettings(JSON.stringify({ version: 2, extra: true, config: { ...config, extra: 1, herbivore: { ...config.herbivore, extra: 2 } } }))).toEqual(config);
  });

  it('migrates version 1 without changing its input or other parameters', () => {
    const config = copyConfig(defaultConfig);
    config.herbivore.maxEnergy = 32; config.carnivore.maxEnergy = 46;
    const legacy = JSON.parse(JSON.stringify(config));
    delete legacy.herbivore.initialEnergy; delete legacy.carnivore.initialEnergy;
    const text = JSON.stringify({ version: 1, config: legacy });
    const loaded = parseSettings(text);
    expect(loaded).toEqual({ ...config, herbivore: { ...config.herbivore, initialEnergy: 16 }, carnivore: { ...config.carnivore, initialEnergy: 23 } });
    expect(JSON.parse(serializeSettings(loaded))).toEqual({ version: 2, config: loaded });
    expect(legacy.herbivore.initialEnergy).toBeUndefined();
    expect(() => parseSettings(JSON.stringify({ version: 2, config: legacy }))).toThrow(/Startenergie/);
  });

  it('rejects invalid JSON, envelopes and unsupported versions', () => {
    for (const text of ['', '{', 'null', '[]', '2', '"settings"', '{}', JSON.stringify(defaultConfig), ...[0, 3, '2', null].map(version => JSON.stringify({ version, config: defaultConfig }))]) {
      expect(() => parseSettings(text)).toThrow();
    }
    expect(() => parseSettings('{')).toThrow(/gültiges JSON/);
    expect(() => parseSettings('{"version":3}')).toThrow(/version/);
  });

  it('keeps both README examples valid, complete and consistent with the defaults', () => {
    for (const markdown of [englishReadme, germanReadme]) {
      const example = markdown.match(/```json\r?\n([\s\S]*?)\r?\n```/)![1];
      expect(parseSettings(example)).toEqual(defaultConfig);
    }
  });

  it('requires every numeric leaf and applies all domain rules on read and write', () => {
    for (const field of settingFields) {
      for (const invalid of [undefined, null, '2', false, {}, []]) {
        const config = JSON.parse(JSON.stringify(defaultConfig));
        const [parent, child] = field.path.split('.');
        if (child) config[parent][child] = invalid;
        else config[parent] = invalid;
        expect(() => parseSettings(JSON.stringify({ version: 2, config }))).toThrow();
      }
    }
    for (const config of [
      { ...defaultConfig, width: 1, height: 1 },
      { ...defaultConfig, width: 1.5 },
      { ...defaultConfig, grassGrowthPerSecond: 2 },
      { ...defaultConfig, speedMultiplier: Infinity },
      { ...defaultConfig, herbivore: { ...defaultConfig.herbivore, initialEnergy: 21 } },
    ]) {
      expect(() => serializeSettings(config)).toThrow();
      expect(() => parseSettings(JSON.stringify({ version: 2, config }))).toThrow();
    }
  });
});
