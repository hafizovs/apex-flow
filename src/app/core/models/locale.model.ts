export type { LocaleId } from '../../models/app.types';

import type { LocaleId } from '../../models/app.types';

export const LOCALES: readonly LocaleId[] = ['ru', 'en'] as const;

export function isLocaleId(value: unknown): value is LocaleId {
  return value === 'ru' || value === 'en';
}

export function toggleLocale(current: LocaleId): LocaleId {
  return current === 'ru' ? 'en' : 'ru';
}
