import { expect, it } from 'vitest';
import { catalogProblems, copiedMessages } from '../src/catalog-check';
import { catalogs } from '../src/i18n';

const flags = Object.keys(import.meta.glob('../src/flags/*.svg')).map(path => path.split('/').at(-1)!.replace('.svg', ''));
it('ships the agreed thirty languages, with distinct Chinese scripts and native names', () => {
  expect(Object.keys(catalogs).sort()).toEqual('en de fr es it pt nl pl cs uk ru tr el ro hu sv da fi nb ar he hi bn zh-Hans zh-Hant ja ko id vi th'.split(' ').sort());
  expect(new Set(Object.values(catalogs).map(catalog => catalog['language.nativeName'])).size).toBe(30);
  const metadata: Record<string, string> = {
    en: 'English|gb', de: 'Deutsch|de', fr: 'Français|fr', es: 'Español|es', it: 'Italiano|it', pt: 'Português|pt',
    nl: 'Nederlands|nl', pl: 'Polski|pl', cs: 'Čeština|cz', uk: 'Українська|ua', ru: 'Русский|ru', tr: 'Türkçe|tr',
    el: 'Ελληνικά|gr', ro: 'Română|ro', hu: 'Magyar|hu', sv: 'Svenska|se', da: 'Dansk|dk', fi: 'Suomi|fi',
    nb: 'Norsk bokmål|no', ar: 'العربية|eg', he: 'עברית|il', hi: 'हिन्दी|in', bn: 'বাংলা|bd',
    'zh-Hans': '简体中文|cn', 'zh-Hant': '繁體中文|tw', ja: '日本語|jp', ko: '한국어|kr', id: 'Bahasa Indonesia|id', vi: 'Tiếng Việt|vn', th: 'ไทย|th',
  };
  for (const [locale, expected] of Object.entries(metadata)) expect(`${catalogs[locale]['language.nativeName']}|${catalogs[locale]['language.flag']}`).toBe(expected);
  expect(catalogs['zh-Hans']['settings.title']).not.toBe(catalogs['zh-Hant']['settings.title']);
  expect(Object.entries(catalogs).filter(([, catalog]) => catalog['language.direction'] === 'rtl').map(([locale]) => locale).sort()).toEqual(['ar', 'he']);
});
it('validates all shipped catalogs including metadata and local flags', () => {
  for (const [locale, catalog] of Object.entries(catalogs)) expect(catalogProblems(catalogs.en, catalog, flags), locale).toEqual([]);
});
it('rejects missing messages, invalid metadata, unknown flags and changed parameters', () => {
  const { 'app.title': _title, 'language.direction': _direction, ...missing } = catalogs.en;
  expect(catalogProblems(catalogs.en, missing, flags)).toEqual(expect.arrayContaining(['Missing text: app.title', 'Missing text: language.direction']));
  expect(catalogProblems(catalogs.en, { ...catalogs.en, 'app.title': '', 'language.nativeName': '', 'language.direction': 'bad',
    'language.flag': 'missing', 'world.status': 'Hello {{other}}' }, flags)).toEqual(expect.arrayContaining([
      'Missing text: app.title', 'Missing text: language.nativeName', 'Invalid direction', 'Missing flag', 'Different parameters: world.status',
    ]));
});
it('reports copied messages for review while allowing identical technical fragments', () => {
  expect(copiedMessages({ label: 'JSON', message: 'Settings saved.', 'fields.name': '{{group}}: {{label}}' },
    { label: 'JSON', message: 'Settings saved.', 'fields.name': '{{group}}: {{label}}' })).toEqual(['label', 'message']);
});
