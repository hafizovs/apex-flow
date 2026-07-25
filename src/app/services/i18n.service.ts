import { inject, Injectable, signal } from '@angular/core';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
} from '../core/constants/auth.constants';
import { UiStore } from '../state/ui.store';
import { EN } from '../i18n/en';
import type { I18nKey } from '../i18n/i18n.keys';
import type { LocaleId } from '../i18n/locale.type';
import { RU } from '../i18n/ru';

const DICTS: Record<LocaleId, Record<I18nKey, string>> = {
  ru: RU,
  en: EN,
};

function readLocale(): LocaleId {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (raw === 'ru' || raw === 'en') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly ui = inject(UiStore);

  readonly locale = signal<LocaleId>(readLocale());

  constructor() {
    this.ui.setLocale(this.locale());
  }

  t(key: I18nKey | string, params?: Record<string, string | number>): string {
    const dict = DICTS[this.locale()];
    let text = (dict as Record<string, string>)[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }
    return text;
  }

  setLocale(id: LocaleId): void {
    this.locale.set(id);
    this.ui.setLocale(id);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, id);
    } catch {
      /* ignore */
    }
  }

  toggleLocale(): void {
    this.setLocale(this.locale() === 'ru' ? 'en' : 'ru');
  }
}
