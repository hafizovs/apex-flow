import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';
import { TaskService } from '../../../services/task.service';
import { TeamService } from '../../../services/team.service';
import { UiStore } from '../../../state/ui.store';
import { LoadingSpinnerComponent } from '../../shared/loading-spinner/loading-spinner.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { RoleBadgeComponent } from '../../shared/role-badge/role-badge.component';

@Component({
  selector: 'afx-topbar',
  imports: [LoadingSpinnerComponent, RoleBadgeComponent, ModalComponent],
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  private readonly auth = inject(AuthService);
  protected readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly tasks = inject(TaskService);
  private readonly team = inject(TeamService);
  private readonly router = inject(Router);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly menuOpen = signal(false);
  protected readonly resetConfirmOpen = signal(false);
  protected readonly path = signal(this.router.url);

  protected readonly user = this.auth.currentUser;
  protected readonly isAdmin = computed(() => this.auth.hasRole('admin'));
  protected readonly loading = computed(
    () =>
      this.ui.globalLoading() ||
      this.auth.isLoading() ||
      this.tasks.isLoading() ||
      this.team.isLoading(),
  );

  protected readonly pageTitle = computed(() => {
    const url = this.path();
    if (url.includes('/analytics')) {
      return this.t('analytics.title');
    }
    if (url.includes('/team')) {
      return this.t('team.title');
    }
    return this.t('board.title');
  });

  protected readonly themeLabel = computed(() =>
    this.ui.theme() === 'dark' ? this.t('theme.light') : this.t('theme.dark'),
  );

  protected readonly localeLabel = computed(() =>
    this.i18n.locale() === 'ru' ? 'EN' : 'RU',
  );

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((e) => this.path.set(e.urlAfterRedirects));
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected toggleTheme(): void {
    this.ui.toggleTheme();
  }

  protected toggleLocale(): void {
    this.i18n.toggleLocale();
  }

  protected toggleHelp(): void {
    this.ui.toggleHelp();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }

  protected openResetConfirm(): void {
    this.menuOpen.set(false);
    this.resetConfirmOpen.set(true);
  }

  protected closeResetConfirm(): void {
    this.resetConfirmOpen.set(false);
  }

  protected confirmReset(): void {
    this.team.resetDemo().subscribe({
      next: () => {
        this.tasks.loadTasks().subscribe();
        this.ui.showToast('toast.demoReset');
        this.resetConfirmOpen.set(false);
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent): void {
    if (!this.menuOpen()) {
      return;
    }
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.menuOpen.set(false);
  }
}
