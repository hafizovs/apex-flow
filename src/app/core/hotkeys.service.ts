import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, fromEvent } from 'rxjs';
import { UiStore } from './ui/ui.store';
import { I18nService } from './i18n.service';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  return target.isContentEditable;
}

@Injectable({ providedIn: 'root' })
export class HotkeysService {
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private currentUrl = '';
  private started = false;

  start(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.currentUrl = e.urlAfterRedirects;
      });

    fromEvent<KeyboardEvent>(window, 'keydown')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.onKeyDown(event));
  }

  private onKeyDown(event: KeyboardEvent): void {
    const editable = isEditableTarget(event.target);

    if (event.key === 'Escape') {
      this.ui.closeOverlays();
      return;
    }

    if (editable) {
      return;
    }

    if (event.key === '?' || (event.shiftKey && event.key === '/')) {
      event.preventDefault();
      this.ui.toggleHelp();
      return;
    }

    if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      this.i18n.toggleLocale();
      return;
    }

    if (event.key === 't' || event.key === 'T') {
      event.preventDefault();
      this.ui.toggleTheme();
      return;
    }

    if ((event.key === 'n' || event.key === 'N') && this.currentUrl.includes('/board')) {
      event.preventDefault();
      this.ui.openNewTaskModal();
    }
  }
}
