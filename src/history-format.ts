export type HistoryNumberKind = 'integer' | 'decimal';
export const metricCharacters = 12;
export const timeCharacters = 16;
const formats = new Map<string, { integer: Intl.NumberFormat; decimal: Intl.NumberFormat; scientific: Intl.NumberFormat }>();

/** Text only: rounding and shortening must never feed back into the measurements. */
export function formatHistoryNumber(value: number, kind: HistoryNumberKind, capacity = metricCharacters, locale = 'en'): { text: string; full: string } {
  let format = formats.get(locale);
  if (!format) {
    format = {
      integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
      decimal: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      scientific: new Intl.NumberFormat(locale, { notation: 'scientific', minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    };
    formats.set(locale, format);
  }
  const { integer, decimal, scientific } = format;
  const full = (kind === 'integer' ? integer : decimal).format(value);
  return { text: full.length <= capacity ? full : scientific.format(value), full };
}
