export type { TaskStatus, ColumnId } from './app.types';

import type { ColumnId, TaskStatus } from './app.types';

export const TASK_STATUSES: readonly TaskStatus[] = [
  'backlog',
  'in_progress',
  'review',
  'done',
] as const;

export const STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  backlog: 'status.backlog',
  in_progress: 'status.inProgress',
  review: 'status.review',
  done: 'status.done',
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    value === 'backlog' ||
    value === 'in_progress' ||
    value === 'review' ||
    value === 'done'
  );
}

export function isColumnId(value: unknown): value is ColumnId {
  return isTaskStatus(value);
}

export function statusLabelKey(status: TaskStatus): string {
  return STATUS_LABEL_KEYS[status];
}
