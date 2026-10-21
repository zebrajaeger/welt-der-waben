import { describe, expect, it } from 'vitest';
import { createLocalization } from '../src/i18n';
import { languageKey, preferredLocalization, saveLanguage } from '../src/language-storage';

describe('manual language preference', () => {
  it('overrides browser preferences and stores only a separate language key', () => {
    const values = new Map([['carnivore-sim.settings', 'existing config']]);
    const storage = () => ({ getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } });
    expect(preferredLocalization(['en-US'], undefined, storage).locale).toBe('en');
    saveLanguage('de', storage);
    expect(values.get(languageKey)).toBe('de');
    expect(values.get('carnivore-sim.settings')).toBe('existing config');
    expect(preferredLocalization(['en-US'], undefined, storage).locale).toBe('de');
    saveLanguage('unknown', storage);
    expect(values.get(languageKey)).toBe('de');
    values.set(languageKey, 'unknown');
    expect(preferredLocalization(['de-DE'], undefined, storage).locale).toBe('de');
  });
  it('survives denied access and failed writes', () => {
    const denied = () => { throw new Error('denied'); };
    expect(preferredLocalization(['de-CH'], undefined, denied).locale).toBe('de');
    expect(() => saveLanguage('en', denied)).not.toThrow();
  });
  it('changes messages and cached number formats immediately', () => {
    const i18n = createLocalization(['en']);
    expect(i18n.number(10.5)).toBe('10.5');
    i18n.setLanguage('de');
    expect(i18n.locale).toBe('de');
    expect(i18n.number(10.5)).toBe('10,5');
    expect(i18n.t('controls.resume')).toBe('Weiter');
    i18n.setLanguage('unknown');
    expect(i18n.locale).toBe('de');
    i18n.setLanguage('en');
    expect(i18n.t('controls.resume')).toBe('Resume');
    expect(i18n.number(10.5)).toBe('10.5');
  });
});
