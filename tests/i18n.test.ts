import { describe, expect, it } from 'vitest';
import { catalogs, catalogsFromFiles, createLocalization, selectLanguage } from '../src/i18n';
import { settingFields } from '../src/settings';
import { metrics } from '../src/history-chart';

describe('localization', () => {
  it('ships complete catalogs with matching placeholders and English reference keys', () => {
    const placeholders = (value: string) => [...value.matchAll(/{{\s*(\w+)\s*}}/g)].map(match => match[1]).sort();
    for (const catalog of Object.values(catalogs)) {
      expect(Object.keys(catalog).sort()).toEqual(Object.keys(catalogs.en).sort());
      for (const [key, value] of Object.entries(catalog)) {
        if (key !== 'language.flag') expect(value.trim(), key).not.toBe('');
        expect(placeholders(value), key).toEqual(placeholders(catalogs.en[key]));
      }
    }
    const sourceFiles = import.meta.glob('../src/*.ts', { eager: true, query: '?raw', import: 'default' });
    const html = Object.values(import.meta.glob('../index.html', { eager: true, query: '?raw', import: 'default' }))[0];
    for (const source of [html, ...Object.values(sourceFiles)]) {
      for (const match of String(source).matchAll(/\bt\(['"]([\w.]+)['"]|data-i18n(?:-[\w-]+)?="([\w.]+)"/g)) {
        expect(catalogs.en[match[1] ?? match[2]], match[1] ?? match[2]).toBeTruthy();
      }
    }
    for (const key of [...settingFields.flatMap(field => [field.label, field.group]),
      ...metrics.flatMap(metric => [metric.label, `tooltip.${metric.key}`])]) expect(catalogs.en[key], key).toBeTruthy();
  });
  it('uses English for missing and empty translations', () => {
    const i18n = createLocalization(['de'], undefined, { en: { greeting: 'Hello {{name}}', empty: 'English' }, de: { empty: '' } });
    expect(i18n.t('greeting', { name: '<Lars>' })).toBe('Hello <Lars>');
    expect(i18n.t('empty')).toBe('English');
    expect(i18n.number(10.5, { minimumFractionDigits: 2 })).toBe('10,50');
  });
  it.each([
    [['de-CH'], undefined, 'de'], [['en-GB'], undefined, 'en'],
    [['fr-FR', 'de-DE', 'en-US'], undefined, 'de'], [['fr'], undefined, 'en'],
    [['invalid_tag', 'de'], undefined, 'de'], [[], 'de-DE', 'de'], [undefined, undefined, 'en'],
  ])('selects %j / %s as %s', (preferences, language, expected) => {
    expect(selectLanguage(preferences, language, ['en', 'de'])).toBe(expected);
  });
  it('prefers an exact regional catalog and discovers new files', () => {
    const fixtureFiles = import.meta.glob<import('../src/i18n').Catalog>('./fixtures/locales/*.json', { eager: true, import: 'default' });
    const resources = catalogsFromFiles({ './locales/en.json': catalogs.en, ...fixtureFiles, './locales/de-CH.json': {} });
    expect(selectLanguage(['de-CH'], undefined, Object.keys(resources))).toBe('de-CH');
    expect(createLocalization(['fr-FR'], undefined, resources).t('app.title')).toBe('Écosystème');
  });
  it('resolves individual regional messages through base language and English', () => {
    const i18n = createLocalization(['de-CH'], undefined, {
      en: { regional: 'English', base: 'Base English', fallback: 'Fallback' },
      de: { regional: 'Deutsch', base: 'Basis' }, 'de-CH': { regional: 'Schweiz', base: '' },
    });
    expect(i18n.t('regional')).toBe('Schweiz');
    expect(i18n.t('base')).toBe('Basis');
    expect(i18n.t('fallback')).toBe('Fallback');
  });
});
