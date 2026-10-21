import type { PriorityStat, Task, TaskPriority } from '../../core/models/app.types';

const PRIORITY_ORDER: readonly TaskPriority[] = ['high', 'medium', 'low'];

const LABEL_KEYS: Record<TaskPriority, string> = {
  high: 'priority.high',
  medium: 'priority.medium',
  low: 'priority.low',
};

export function computePriorityStats(tasks: Task[]): PriorityStat[] {
  const counts: Record<TaskPriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const task of tasks) {
    counts[task.priority] += 1;
  }

  return PRIORITY_ORDER.map((priority) => ({
    priority,
    count: counts[priority],
    labelKey: LABEL_KEYS[priority],
  }));
}
