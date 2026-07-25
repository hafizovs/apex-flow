import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
} from '@angular/core';
import type { Task } from '../../../models/app.types';
import { I18nService } from '../../../services/i18n.service';
import { PriorityBadgeComponent } from '../../shared/priority-badge/priority-badge.component';

@Component({
  selector: 'afx-task-card',
  imports: [PriorityBadgeComponent],
  templateUrl: './task-card.component.html',
  styleUrl: './task-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskCardComponent {
  readonly task = input.required<Task>();
  readonly dragging = input(false);
  readonly openDetail = output<string>();
  readonly dragStart = output<{ taskId: string; event: PointerEvent }>();

  protected readonly i18n = inject(I18nService);

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected visibleTags(task: Task): string[] {
    return task.tags.slice(0, 3);
  }

  protected extraTags(task: Task): number {
    return Math.max(0, task.tags.length - 3);
  }

  protected initial(name: string): string {
    return (name.trim()[0] ?? '?').toUpperCase();
  }

  protected onHandlePointerDown(event: PointerEvent): void {
    event.stopPropagation();
    this.dragStart.emit({ taskId: this.task().id, event });
  }

  protected onOpen(): void {
    this.openDetail.emit(this.task().id);
  }
}
