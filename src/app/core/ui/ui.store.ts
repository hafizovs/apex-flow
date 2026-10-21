import { Injectable, computed, signal } from '@angular/core';
import {
  DEFAULT_LOCALE,
  DEFAULT_THEME,
  LOCALE_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from '../constants/auth.constants';
import { TOAST_DURATION_MS } from '../constants/ui.constants';
import type { LocaleId, TeamModalMode, ThemeId } from '../models/app.types';

function readStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark' || raw === 'light') {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

function readStoredLocale(): LocaleId {
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
export class UiStore {
  readonly theme = signal<ThemeId>(readStoredTheme());
  readonly locale = signal<LocaleId>(readStoredLocale());
  readonly helpOpen = signal(false);
  readonly toastMessage = signal<string | null>(null);
  readonly globalLoading = signal(false);
  readonly selectedTaskId = signal<string | null>(null);
  readonly teamModalOpen = signal<TeamModalMode>(null);
  readonly newTaskModalOpen = signal(false);
  readonly confirmDeleteTaskId = signal<string | null>(null);
  readonly confirmDeleteOpen = computed(
    () => this.confirmDeleteTaskId() !== null,
  );

  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.applyTheme();
  }

  applyTheme(): void {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.setAttribute('data-theme', this.theme());
  }

  setTheme(theme: ThemeId): void {
    this.theme.set(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setLocale(locale: LocaleId): void {
    this.locale.set(locale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }

  toggleLocale(): void {
    this.setLocale(this.locale() === 'ru' ? 'en' : 'ru');
  }

  toggleHelp(): void {
    this.helpOpen.update((open) => !open);
  }

  setHelpOpen(open: boolean): void {
    this.helpOpen.set(open);
  }

  showToast(message: string): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage.set(message);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set(null);
      this.toastTimer = null;
    }, TOAST_DURATION_MS);
  }

  clearToast(): void {
    if (this.toastTimer !== null) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.toastMessage.set(null);
  }

  setGlobalLoading(loading: boolean): void {
    this.globalLoading.set(loading);
  }

  selectTask(taskId: string | null): void {
    this.selectedTaskId.set(taskId);
  }

  openTeamModal(mode: Exclude<TeamModalMode, null>): void {
    this.teamModalOpen.set(mode);
  }

  closeTeamModal(): void {
    this.teamModalOpen.set(null);
  }

  openNewTaskModal(): void {
    this.newTaskModalOpen.set(true);
  }

  closeNewTaskModal(): void {
    this.newTaskModalOpen.set(false);
  }

  requestDeleteTask(taskId: string): void {
    this.confirmDeleteTaskId.set(taskId);
  }

  clearDeleteConfirm(): void {
    this.confirmDeleteTaskId.set(null);
  }

  closeOverlays(): void {
    this.helpOpen.set(false);
    this.teamModalOpen.set(null);
    this.newTaskModalOpen.set(false);
    this.confirmDeleteTaskId.set(null);
    this.selectedTaskId.set(null);
  }
}
