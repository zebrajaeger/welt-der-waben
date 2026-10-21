import { describe, expect, it } from 'vitest';
import { formatHistoryNumber, metricCharacters, timeCharacters } from '../src/history-format';
import { catalogs, createLocalization } from '../src/i18n';

describe.each(Object.keys(catalogs))('history number presentation (%s)', locale => {
  const numberLocale = locale === 'ar' ? 'ar-u-nu-arab' : locale;
  const format = (value: number, kind: 'integer' | 'decimal', capacity = metricCharacters) => formatHistoryNumber(value, kind, capacity, locale);
  const decimal = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  it.each([0, 9.99, 10, 10.5, 10.56, 99.99, 100, 999.99, 1000])('shows %s with two fixed decimal places', value => {
    const expected = decimal.format(value);
    expect(format(value, 'decimal')).toEqual({ text: expected, full: expected });
    expect(decimal.formatToParts(value).find(part => part.type === 'fraction')!.value.length).toBe(2);
  });
  it.each([0, 9, 10, 99, 100, 999, 1000, 18720])('keeps count and tick %s integral', value => {
    expect(format(value, 'integer', timeCharacters).text).toBe(new Intl.NumberFormat(numberLocale).format(value));
  });
  it('rounds presentation only and keeps X-axis fractions fixed', () => {
    const value = 99.999;
    expect(format(value, 'decimal').text).toBe(decimal.format(100));
    expect(value).toBe(99.999);
    const i18n = createLocalization([locale]);
    const axis = new Intl.NumberFormat(numberLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    for (const value of [0, 9.9, 10, 99.9, 100]) {
      expect(i18n.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).toBe(axis.format(value));
      expect(axis.formatToParts(value).find(part => part.type === 'fraction')!.value.length).toBe(1);
    }
  });
  it.each(['integer', 'decimal'] as const)('fits large finite %s values while retaining full output', kind => {
    for (const capacity of [metricCharacters, timeCharacters]) for (const value of [1e12, 1e25, 6e15, 1e100, Number.MAX_VALUE]) {
      const formatted = format(value, kind, capacity);
      expect(formatted.text.length).toBeLessThanOrEqual(capacity);
      const digits = kind === 'integer' ? 0 : 2;
      expect(formatted.full).toBe(new Intl.NumberFormat(numberLocale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value));
      if (formatted.full.length > capacity) expect(formatted.text).toBe(new Intl.NumberFormat(numberLocale,
        { notation: 'scientific', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value));
    }
  });
});
it('uses Arabic digits and Indian grouping without changing the measurements', () => {
  expect(formatHistoryNumber(1234.5, 'decimal', 16, 'ar').text).toBe('١٬٢٣٤٫٥٠');
  expect(formatHistoryNumber(1234567, 'integer', 16, 'hi').text).toBe('12,34,567');
  expect(formatHistoryNumber(1234567, 'integer', 16, 'bn').text).toBe('১২,৩৪,৫৬৭');
});
it('shortens wide Bengali digits before they overflow a fixed metric slot', () => {
  const formatted = formatHistoryNumber(999999.99, 'decimal', 12, 'bn');
  expect(formatted.text).toBe(new Intl.NumberFormat('bn', { notation: 'scientific', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(999999.99));
  expect(formatted.full).toBe('৯,৯৯,৯৯৯.৯৯');
});
