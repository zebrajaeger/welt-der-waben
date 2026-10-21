import { ApplicationError } from './errors';
import { settingFields } from './settings';
import type { Localization } from './i18n';

export function errorMessage(error: unknown, i18n: Localization): string {
  if (!(error instanceof ApplicationError)) {
    console.error(error);
    return i18n.t('errors.unknown');
  }
  const field = settingFields.find(field => field.path === error.path);
  return i18n.t(`errors.${error.code}`, {
    ...error.parameters,
    min: typeof error.parameters.min === 'number' ? i18n.number(error.parameters.min) : error.parameters.min,
    field: field ? i18n.t('fields.name', { group: i18n.t(field.group), label: i18n.t(field.label) }) : error.path,
  });
}
