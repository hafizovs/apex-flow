import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { UiStore } from '../../core/ui/ui.store';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'afx-toast',
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastComponent {
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);

  protected readonly message = computed(() => {
    const raw = this.ui.toastMessage();
    if (!raw) {
      return null;
    }
    return this.i18n.t(raw);
  });

  protected readonly isError = computed(() => {
    const raw = this.ui.toastMessage();
    return !!raw && (raw.startsWith('error.') || raw.startsWith('toast.error.'));
  });
}
