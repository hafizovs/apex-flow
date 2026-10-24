export type { LocaleId } from './app.types';

import type { LocaleId } from './app.types';

export const LOCALES: readonly LocaleId[] = ['en', 'ru'] as const;

export function isLocaleId(value: unknown): value is LocaleId {
  return value === 'ru' || value === 'en';
}

export function toggleLocale(current: LocaleId): LocaleId {
  return current === 'ru' ? 'en' : 'ru';
}
