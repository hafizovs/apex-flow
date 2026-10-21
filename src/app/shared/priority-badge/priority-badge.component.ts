import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import type { TaskPriority } from '../../core/models/app.types';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'afx-priority-badge',
  templateUrl: './priority-badge.component.html',
  styleUrl: './priority-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<TaskPriority>();
  protected readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
