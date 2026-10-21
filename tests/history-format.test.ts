import { describe, expect, it } from 'vitest';
import { formatHistoryNumber, metricCharacters, timeCharacters } from '../src/history-format';

describe('history number presentation', () => {
  it.each([[0, '0,00'], [9.99, '9,99'], [10, '10,00'], [10.5, '10,50'], [10.56, '10,56'],
    [99.99, '99,99'], [100, '100,00'], [999.99, '999,99'], [1000, '1.000,00']] as const)
  ('shows %s with two fixed decimal places', (value, expected) => {
    expect(formatHistoryNumber(value, 'decimal')).toEqual({ text: expected, full: expected });
  });
  it.each([0, 9, 10, 99, 100, 999, 1000, 18720])('keeps count and tick %s integral', value => {
    const formatted = formatHistoryNumber(value, 'integer', timeCharacters);
    expect(formatted.text).toBe(new Intl.NumberFormat('de-DE').format(value));
    expect(formatted.text).not.toContain(',');
  });
  it('rounds only the presentation, including carry to another integer digit', () => {
    const value = 99.999;
    expect(formatHistoryNumber(value, 'decimal').text).toBe('100,00');
    expect(value).toBe(99.999);
  });
  it.each(['integer', 'decimal'] as const)('fits large finite %s values while retaining the full output', kind => {
    for (const capacity of [metricCharacters, timeCharacters]) for (const value of [1e12, 1e25, 6e15, 1e100, Number.MAX_VALUE]) {
      const formatted = formatHistoryNumber(value, kind, capacity);
      expect(formatted.text.length).toBeLessThanOrEqual(capacity);
      const digits = kind === 'integer' ? 0 : 2;
      expect(formatted.full).toBe(new Intl.NumberFormat('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value));
      if (formatted.full.length > capacity) expect(formatted.text).toMatch(/^\d,\d{2}E\d+$/);
    }
    expect(formatHistoryNumber(10, kind).text).toBe(kind === 'integer' ? '10' : '10,00');
  });
});
