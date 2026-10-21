import { createInstance, type Resource } from 'i18next';

export type Catalog = Record<string, string>;
export function catalogsFromFiles(files: Record<string, Catalog>): Record<string, Catalog> {
  return Object.fromEntries(Object.entries(files).map(([path, catalog]) => {
    const filename = path.split('/').at(-1)!.replace(/\.json$/, '');
    return [Intl.getCanonicalLocales(filename)[0], catalog];
  }));
}
export const catalogs = catalogsFromFiles(import.meta.glob<Catalog>('./locales/*.json', { eager: true, import: 'default' }));

export function selectLanguage(preferences: readonly string[] | undefined, language: string | undefined,
  supported: readonly string[]): string {
  for (const preference of preferences?.length ? preferences : [language]) {
    if (!preference) continue;
    try {
      const exact = Intl.getCanonicalLocales(preference)[0];
      for (const candidate of [exact, exact.split('-')[0]]) {
        if (supported.includes(candidate)) return candidate;
      }
    } catch { /* Ignore malformed browser language identifiers. */ }
  }
  return 'en';
}

export function createLocalization(preferences: readonly string[] = [], language?: string,
  resources: Record<string, Catalog> = catalogs) {
  let locale = selectLanguage(preferences, language, Object.keys(resources));
  const instance = createInstance();
  const bundled: Resource = Object.fromEntries(Object.entries(resources).map(([key, translation]) => [key, { translation }]));
  // All resources are bundled: initialization finishes synchronously without a backend.
  void instance.init({ lng: locale, fallbackLng: 'en', resources: bundled, initAsync: false,
    keySeparator: false, returnEmptyString: false, interpolation: { escapeValue: false } });
  const formats = new Map<string, Intl.NumberFormat>();
  return {
    get locale() { return locale; },
    setLanguage(language: string): void {
      if (!Object.hasOwn(resources, language) || language === locale) return;
      locale = language;
      formats.clear();
      void instance.changeLanguage(language);
    },
    t(key: string, values: Record<string, unknown> = {}): string { return instance.t(key, values); },
    number(value: number, options: Intl.NumberFormatOptions = {}): string {
      const key = JSON.stringify(options);
      let format = formats.get(key);
      if (!format) { format = new Intl.NumberFormat(locale, options); formats.set(key, format); }
      return format.format(value);
    },
  };
}
export type Localization = ReturnType<typeof createLocalization>;

export function translateDocument(document: Document, i18n: Localization): void {
  document.documentElement.lang = i18n.locale;
  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = i18n.t(element.dataset.i18n!);
  }
  for (const attribute of ['aria-label', 'title']) {
    for (const element of document.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, i18n.t(element.getAttribute(`data-i18n-${attribute}`)!));
    }
  }
}
