import type { KanbanColumnDef } from '../../models/app.types';

export const MAX_TASK_TITLE = 120;
export const MAX_TASK_DESCRIPTION = 4000;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 24;

export const COLUMN_DEFINITIONS: readonly KanbanColumnDef[] = [
  { id: 'backlog', titleKey: 'board.column.backlog', order: 0 },
  { id: 'in_progress', titleKey: 'board.column.inProgress', order: 1 },
  { id: 'review', titleKey: 'board.column.review', order: 2 },
  { id: 'done', titleKey: 'board.column.done', order: 3 },
];
