import type { ColumnId, Task } from '../../core/models/app.types';
import { isColumnId } from '../../core/models/task-status.model';

/**
 * Resolve drop column from pointer coordinates.
 * Prefers bounding-box hit against `columnElements`; falls back to
 * document.elementFromPoint + closest('[data-column-id]').
 */
export function findColumnIdFromPoint(
  x: number,
  y: number,
  columnElements?: Map<ColumnId, HTMLElement>,
): ColumnId | null {
  if (columnElements && columnElements.size > 0) {
    for (const [columnId, element] of columnElements) {
      const rect = element.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return columnId;
      }
    }
  }

  if (typeof document === 'undefined' || typeof document.elementFromPoint !== 'function') {
    return null;
  }

  const el = document.elementFromPoint(x, y);
  return findColumnIdFromElement(el);
}

/** Resolve column id from a DOM element via closest('[data-column-id]'). */
export function findColumnIdFromElement(
  el: Element | null,
): ColumnId | null {
  if (!el) {
    return null;
  }

  const columnEl = el.closest('[data-column-id]');
  if (!columnEl) {
    return null;
  }

  const raw = columnEl.getAttribute('data-column-id');
  if (!raw || !isColumnId(raw)) {
    return null;
  }

  return raw;
}

/** v1: no WIP limits — any column is a valid drop target */
export function canDropTask(_task: Task, _targetColumn: ColumnId): boolean {
  return true;
}
