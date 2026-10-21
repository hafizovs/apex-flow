import { describe, it, expect } from 'vitest';
import type { Task } from '../../core/models/app.types';
import { applyTaskFilters } from './task-filters';

function makeTask(partial: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: partial.title ?? `Task ${partial.id}`,
    description: partial.description ?? '',
    assigneeId: partial.assigneeId ?? 'usr_dev',
    assigneeName: partial.assigneeName ?? 'Dan Developer',
    priority: partial.priority ?? 'medium',
    tags: partial.tags ?? [],
    status: partial.status ?? 'backlog',
    changeLog: partial.changeLog ?? [],
    createdAt: partial.createdAt ?? '2026-07-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

describe('applyTaskFilters', () => {
  const tasks: Task[] = [
    makeTask({ id: 'tsk_1', assigneeId: 'usr_dev', priority: 'high' }),
    makeTask({ id: 'tsk_2', assigneeId: 'usr_dev2', priority: 'high' }),
    makeTask({ id: 'tsk_3', assigneeId: 'usr_dev', priority: 'low' }),
    makeTask({ id: 'tsk_4', assigneeId: 'usr_manager', priority: 'medium' }),
  ];

  it('returns all tasks when filters are all', () => {
    const result = applyTaskFilters(tasks, {
      assigneeId: 'all',
      priority: 'all',
    });
    expect(result).toHaveLength(4);
  });

  it('filters by assigneeId', () => {
    const result = applyTaskFilters(tasks, {
      assigneeId: 'usr_dev',
      priority: 'all',
    });
    expect(result.map((t) => t.id)).toEqual(['tsk_1', 'tsk_3']);
  });

  it('filters by priority', () => {
    const result = applyTaskFilters(tasks, {
      assigneeId: 'all',
      priority: 'high',
    });
    expect(result.map((t) => t.id)).toEqual(['tsk_1', 'tsk_2']);
  });

  it('applies assignee and priority together', () => {
    const result = applyTaskFilters(tasks, {
      assigneeId: 'usr_dev',
      priority: 'high',
    });
    expect(result.map((t) => t.id)).toEqual(['tsk_1']);
  });

  it('returns empty array when nothing matches', () => {
    const result = applyTaskFilters(tasks, {
      assigneeId: 'usr_missing',
      priority: 'low',
    });
    expect(result).toEqual([]);
  });
});
