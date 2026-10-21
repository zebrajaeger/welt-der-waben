export type HistoryNumberKind = 'integer' | 'decimal';
export const metricCharacters = 12;
export const timeCharacters = 16;
const formats = new Map<string, { integer: Intl.NumberFormat; decimal: Intl.NumberFormat; scientific: Intl.NumberFormat }>();

/** Text only: rounding and shortening must never feed back into the measurements. */
export function formatHistoryNumber(value: number, kind: HistoryNumberKind, capacity = metricCharacters, locale = 'en'): { text: string; full: string } {
  let format = formats.get(locale);
  if (!format) {
    // CLDR versions disagree on the default for bare "ar"; keep the UI consistent.
    const numberingSystem = locale === 'ar' ? 'arab' : undefined;
    format = {
      integer: new Intl.NumberFormat(locale, { numberingSystem, maximumFractionDigits: 0 }),
      decimal: new Intl.NumberFormat(locale, { numberingSystem, minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      scientific: new Intl.NumberFormat(locale, { numberingSystem, notation: 'scientific', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
    formats.set(locale, format);
  }
  const { integer, decimal, scientific } = format;
  const full = (kind === 'integer' ? integer : decimal).format(value);
  // Bengali fallback glyphs are wider than the Latin zero defining the CSS ch slot.
  const fittingCharacters = locale === 'bn' ? Math.floor(capacity * .75) : capacity;
  return { text: full.length <= fittingCharacters ? full : scientific.format(value), full };
}
