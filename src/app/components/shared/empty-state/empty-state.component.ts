import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { I18nService } from '../../../services/i18n.service';

@Component({
  selector: 'afx-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly titleKey = input.required<string>();
  readonly descriptionKey = input<string>('');
  readonly actionLabelKey = input<string>('');
  readonly compact = input(false);
  readonly action = output<void>();

  protected readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
