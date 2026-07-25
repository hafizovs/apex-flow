import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { Role } from '../../../models/app.types';
import { AuthService } from '../../../services/auth.service';
import { I18nService } from '../../../services/i18n.service';

interface NavItem {
  path: string;
  labelKey: string;
  roles: Role[] | 'all';
}

@Component({
  selector: 'afx-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  private readonly allItems: NavItem[] = [
    { path: '/board', labelKey: 'nav.board', roles: 'all' },
    { path: '/analytics', labelKey: 'nav.analytics', roles: ['admin', 'manager'] },
    { path: '/team', labelKey: 'nav.team', roles: ['admin'] },
  ];

  protected readonly navItems = computed(() =>
    this.allItems.filter((item) => {
      if (item.roles === 'all') {
        return true;
      }
      return this.auth.hasAnyRole(item.roles);
    }),
  );

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
