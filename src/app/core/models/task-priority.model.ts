export type { TaskPriority } from '../../models/app.types';

import type { TaskPriority } from '../../models/app.types';

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  'high',
  'medium',
  'low',
] as const;

export const PRIORITY_LABEL_KEYS: Record<TaskPriority, string> = {
  high: 'priority.high',
  medium: 'priority.medium',
  low: 'priority.low',
};

export function isTaskPriority(value: unknown): value is TaskPriority {
  return value === 'high' || value === 'medium' || value === 'low';
}

export function priorityLabelKey(priority: TaskPriority): string {
  return PRIORITY_LABEL_KEYS[priority];
}
