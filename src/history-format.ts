export type HistoryNumberKind = 'integer' | 'decimal';
export const metricCharacters = 12;
export const timeCharacters = 16;
const integer = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const scientific = new Intl.NumberFormat('de-DE', { notation: 'scientific', minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Text only: rounding and shortening must never feed back into the measurements. */
export function formatHistoryNumber(value: number, kind: HistoryNumberKind, capacity = metricCharacters): { text: string; full: string } {
  const full = (kind === 'integer' ? integer : decimal).format(value);
  return { text: full.length <= capacity ? full : scientific.format(value), full };
}
