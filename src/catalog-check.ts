import type { Catalog } from './i18n';

const parameters = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}/g)].map(match => match[1]).sort().join(',');
export function catalogProblems(reference: Catalog, catalog: Catalog, flagNames: readonly string[]): string[] {
  const problems: string[] = [];
  for (const key of Object.keys(reference)) {
    const value = catalog[key];
    if (typeof value !== 'string' || (key !== 'language.flag' && !value.trim())) problems.push(`Missing text: ${key}`);
    else if (parameters(value) !== parameters(reference[key])) problems.push(`Different parameters: ${key}`);
  }
  for (const key of Object.keys(catalog)) if (!Object.hasOwn(reference, key)) problems.push(`Unknown key: ${key}`);
  if (!['ltr', 'rtl'].includes(catalog['language.direction'])) problems.push('Invalid direction');
  if (catalog['language.flag'] && !flagNames.includes(catalog['language.flag'])) problems.push('Missing flag');
  return problems;
}
export function copiedMessages(reference: Catalog, catalog: Catalog): string[] {
  return Object.keys(reference).filter(key => !key.startsWith('language.') &&
    reference[key] === catalog[key] && /[a-z]{3,}/i.test(reference[key]) && !['fields.name', 'settings.state'].includes(key));
}
