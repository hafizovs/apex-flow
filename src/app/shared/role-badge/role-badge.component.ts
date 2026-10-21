import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { Role } from '../../core/models/app.types';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'afx-role-badge',
  templateUrl: './role-badge.component.html',
  styleUrl: './role-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleBadgeComponent {
  readonly role = input.required<Role>();
  protected readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
