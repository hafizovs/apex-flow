import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import type { Task, TaskPriority } from '../../../../../core/models/app.types';
import { I18nService } from '../../../../../core/i18n.service';
import { TaskService } from '../../../task.service';

@Component({
  selector: 'afx-kanban-filters',
  templateUrl: './kanban-filters.component.html',
  styleUrl: './kanban-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanFiltersComponent {
  readonly assignees = input<{ id: string; label: string }[]>([]);
  private readonly tasks = inject(TaskService);
  protected readonly i18n = inject(I18nService);

  protected readonly assigneeFilter = this.tasks.assigneeFilter;
  protected readonly priorityFilter = this.tasks.priorityFilter;

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected onAssignee(value: string): void {
    this.tasks.setAssigneeFilter(value as string | 'all');
  }

  protected onPriority(value: string): void {
    this.tasks.setPriorityFilter(value as TaskPriority | 'all');
  }

  protected reset(): void {
    this.tasks.resetFilters();
  }
}
