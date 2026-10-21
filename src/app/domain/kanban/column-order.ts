import { COLUMN_DEFINITIONS as COLUMN_DEFINITIONS_CONST } from '../../core/constants/kanban.constants';
import type {
  KanbanColumn,
  KanbanColumnDef,
  Task,
} from '../../core/models/app.types';

export const COLUMN_DEFINITIONS: readonly KanbanColumnDef[] =
  COLUMN_DEFINITIONS_CONST;

export function buildKanbanColumns(
  tasks: Task[],
  defs: readonly KanbanColumnDef[] = COLUMN_DEFINITIONS,
): KanbanColumn[] {
  const sortedDefs = [...defs].sort((a, b) => a.order - b.order);

  return sortedDefs.map((def) => {
    const taskIds = tasks
      .filter((task) => task.status === def.id)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .map((task) => task.id);

    return {
      id: def.id,
      titleKey: def.titleKey,
      order: def.order,
      taskIds,
    };
  });
}
