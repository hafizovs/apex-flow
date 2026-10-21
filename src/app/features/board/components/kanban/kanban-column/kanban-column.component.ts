import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import type { KanbanColumn, Task } from '../../../../../core/models/app.types';
import { I18nService } from '../../../../../core/i18n.service';
import { EmptyStateComponent } from '../../../../../shared/empty-state/empty-state.component';
import { TaskCardComponent } from '../task-card/task-card.component';

@Component({
  selector: 'afx-kanban-column',
  imports: [TaskCardComponent, EmptyStateComponent],
  templateUrl: './kanban-column.component.html',
  styleUrl: './kanban-column.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanColumnComponent {
  readonly column = input.required<KanbanColumn>();
  readonly tasks = input<Task[]>([]);
  readonly dragOver = input(false);
  readonly draggingTaskId = input<string | null>(null);
  readonly loading = input(false);
  readonly taskOpen = output<string>();
  readonly dragStart = output<{ taskId: string; event: PointerEvent }>();

  protected readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key);
  }
}
