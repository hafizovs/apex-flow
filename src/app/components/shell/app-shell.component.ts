import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HotkeysService } from '../../services/hotkeys.service';
import { UiStore } from '../../state/ui.store';
import { HelpDrawerComponent } from '../shared/help-drawer/help-drawer.component';
import { ToastComponent } from '../shared/toast/toast.component';
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

  ngOnInit(): void {
    this.hotkeys.start();
  }
}
