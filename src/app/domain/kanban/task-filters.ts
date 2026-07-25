import type { Task, TaskPriority } from '../../models/app.types';

export interface TaskFilterState {
  assigneeId: string | 'all';
  priority: TaskPriority | 'all';
}

export function applyTaskFilters(
  tasks: Task[],
  filters: TaskFilterState,
): Task[] {
  return tasks.filter((task) => {
    if (filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) {
      return false;
    }
    if (filters.priority !== 'all' && task.priority !== filters.priority) {
      return false;
    }
    return true;
  });
}
