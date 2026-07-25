export type { ThemeId } from '../../models/app.types';

import type { ThemeId } from '../../models/app.types';

export const THEMES: readonly ThemeId[] = ['dark', 'light'] as const;

export function isThemeId(value: unknown): value is ThemeId {
  return value === 'dark' || value === 'light';
}

export function toggleTheme(current: ThemeId): ThemeId {
  return current === 'dark' ? 'light' : 'dark';
}
