import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotkeysService } from '../hotkeys.service';
import { I18nService } from '../i18n.service';
import { UiStore } from '../ui/ui.store';
import { HelpDrawerComponent } from '../../shared/help-drawer/help-drawer.component';
import { ToastComponent } from '../../shared/toast/toast.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { TopbarComponent } from './topbar/topbar.component';

@Component({
  selector: 'afx-app-shell',
  imports: [
    RouterOutlet,
    SidebarComponent,
    TopbarComponent,
    ToastComponent,
    HelpDrawerComponent,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
  protected readonly ui = inject(UiStore);
  private readonly hotkeys = inject(HotkeysService);
  private readonly i18n = inject(I18nService);

  ngOnInit(): void {
    this.hotkeys.start();
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected closeMobileNav(): void {
    this.ui.setMobileNavOpen(false);
  }
}
