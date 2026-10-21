import { describe, expect, it } from 'vitest';
import { catalogs, catalogsFromFiles, createLocalization, selectLanguage } from '../src/i18n';
import { settingFields } from '../src/settings';
import { metrics } from '../src/history-chart';

describe('localization', () => {
  it('isolates RTL interpolations while keeping plain translations and tooltip markers intact', () => {
    const i18n = createLocalization(['ar']);
    expect(i18n.direction).toBe('rtl');
    expect(i18n.t('errors.minimum', { field: 'JSON', min: 0 })).toContain('\u2068JSON\u2069');
    expect(i18n.t('errors.minimum', { field: 'JSON', min: 0 })).toContain('\u20680\u2069');
    expect(i18n.t('tooltip.position', { seconds: '\u0000seconds\u0000', tick: '\u0000tick\u0000' })).not.toContain('\u2068');
    expect(i18n.t('settings.title')).toBe(catalogs.ar['settings.title']);
    i18n.setLanguage('fr'); expect(i18n.direction).toBe('ltr');
    expect(i18n.t('errors.minimum', { field: 'JSON', min: 0 })).not.toContain('\u2068');
  });
  it.each([
    ['zh', 'zh-Hans'], ['zh-CN', 'zh-Hans'], ['zh-SG', 'zh-Hans'], ['zh-TW', 'zh-Hant'],
    ['zh-HK', 'zh-Hant'], ['zh-MO', 'zh-Hant'], ['zh-Hans-TW', 'zh-Hans'], ['zh-Hant-CN', 'zh-Hant'],
    ['no', 'nb'], ['no-NO', 'nb'], ['nb-NO', 'nb'], ['nn-NO', 'en'],
  ])('resolves script/alias %s as %s', (preference, expected) => {
    expect(selectLanguage([preference], undefined, ['en', 'de', 'nb', 'zh-Hans', 'zh-Hant'])).toBe(expected);
  });
  it('matches each preference completely before moving to the next', () => {
    expect(selectLanguage(['zh-TW', 'de'], undefined, ['en', 'de', 'zh-Hant'])).toBe('zh-Hant');
    expect(selectLanguage(['de-CH', 'zh-Hant'], undefined, ['en', 'de', 'zh-Hant'])).toBe('de');
  });
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
