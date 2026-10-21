import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiStore } from '../../core/ui/ui.store';
import { I18nService } from '../../core/i18n.service';

@Component({
  selector: 'afx-help-drawer',
  templateUrl: './help-drawer.component.html',
  styleUrl: './help-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpDrawerComponent {
  private readonly ui = inject(UiStore);
  protected readonly i18n = inject(I18nService);

  protected readonly hotkeys = [
    { key: '?', labelKey: 'help.key.help' },
    { key: 'G', labelKey: 'help.key.locale' },
    { key: 'T', labelKey: 'help.key.theme' },
    { key: 'N', labelKey: 'help.key.newTask' },
    { key: 'Esc', labelKey: 'help.key.escape' },
    { key: 'Space', labelKey: 'help.key.space' },
    { key: '← →', labelKey: 'help.key.arrows' },
    { key: 'Enter', labelKey: 'help.key.enter' },
  ] as const;

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected close(): void {
    this.ui.setHelpOpen(false);
  }
}
