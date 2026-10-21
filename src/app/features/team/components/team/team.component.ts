import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SEED_ADMIN_ID } from '../../../../core/constants/auth.constants';
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZE_OPTIONS,
} from '../../../../core/constants/ui.constants';
import { formatDate } from '../../../../domain/shared/date.helpers';
import type {
  PaginatedResult,
  Role,
  SortDirection,
  TeamQuery,
  UserPublic,
} from '../../../../core/models/app.types';
import { I18nService } from '../../../../core/i18n.service';
import { TeamService } from '../../team.service';
import { UiStore } from '../../../../core/ui/ui.store';
import { EmptyStateComponent } from '../../../../shared/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/loading-spinner/loading-spinner.component';
import { TeamMemberModalComponent } from './team-member-modal/team-member-modal.component';

@Component({
  selector: 'afx-team',
  imports: [
    FormsModule,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    TeamMemberModalComponent,
  ],
  templateUrl: './team.component.html',
  styleUrl: './team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamComponent {
  private readonly team = inject(TeamService);
  private readonly ui = inject(UiStore);
  protected readonly i18n = inject(I18nService);

  protected readonly query = signal<TeamQuery>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    search: '',
    roleFilter: 'all',
    sortBy: 'createdAt',
    sortDirection: 'desc',
  });
  protected readonly result = signal<PaginatedResult<UserPublic> | null>(null);
  protected readonly loading = signal(false);
  protected readonly editingUser = signal<UserPublic | null>(null);
  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;
  protected readonly seedAdminId = SEED_ADMIN_ID;

  protected readonly modalMode = this.ui.teamModalOpen;

  protected readonly pages = computed(() => {
    const total = this.result()?.totalPages ?? 1;
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  constructor() {
    effect(() => {
      const q = this.query();
      this.loading.set(true);
      this.team.loadUsers(q).subscribe({
        next: (res) => {
          this.result.set(res);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.ui.showToast('toast.error.generic');
        },
      });
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected formatCreated(iso: string): string {
    return formatDate(iso, this.i18n.locale() === 'ru' ? 'ru-RU' : 'en-GB');
  }

  protected onSearch(value: string): void {
    this.query.update((q) => ({ ...q, search: value, page: 1 }));
  }

  protected onRoleFilter(value: string): void {
    this.query.update((q) => ({
      ...q,
      roleFilter: value as Role | 'all',
      page: 1,
    }));
  }

  protected onPageSize(value: string): void {
    this.query.update((q) => ({
      ...q,
      pageSize: Number(value) || DEFAULT_PAGE_SIZE,
      page: 1,
    }));
  }

  protected goPage(page: number): void {
    const total = this.result()?.totalPages ?? 1;
    if (page < 1 || page > total) {
      return;
    }
    this.query.update((q) => ({ ...q, page }));
  }

  protected sort(column: TeamQuery['sortBy']): void {
    this.query.update((q) => {
      const same = q.sortBy === column;
      const sortDirection: SortDirection =
        same && q.sortDirection === 'asc' ? 'desc' : 'asc';
      return { ...q, sortBy: column, sortDirection, page: 1 };
    });
  }

  protected openAdd(): void {
    this.editingUser.set(null);
    this.ui.openTeamModal('add');
  }

  protected openEdit(user: UserPublic): void {
    this.editingUser.set(user);
    this.ui.openTeamModal('edit');
  }

  protected closeModal(): void {
    this.ui.closeTeamModal();
    this.editingUser.set(null);
  }

  protected onModalSaved(): void {
    this.closeModal();
    this.query.update((q) => ({ ...q }));
  }

  protected onRoleChange(user: UserPublic, role: string): void {
    if (user.id === SEED_ADMIN_ID) {
      this.ui.showToast('team.cannotBlockAdmin');
      return;
    }
    this.team.updateUser(user.id, { role: role as Role }).subscribe({
      next: () => {
        this.ui.showToast('toast.userUpdated');
        this.query.update((q) => ({ ...q }));
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }

  protected toggleBlock(user: UserPublic): void {
    if (user.id === SEED_ADMIN_ID) {
      this.ui.showToast('team.cannotBlockAdmin');
      return;
    }
    this.team.updateUser(user.id, { isBlocked: !user.isBlocked }).subscribe({
      next: () => {
        this.ui.showToast('toast.userUpdated');
        this.query.update((q) => ({ ...q }));
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }

  protected sortMark(column: TeamQuery['sortBy']): string {
    const q = this.query();
    if (q.sortBy !== column) {
      return '';
    }
    return q.sortDirection === 'asc' ? ' ▲' : ' ▼';
  }
}
