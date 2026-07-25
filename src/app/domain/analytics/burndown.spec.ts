import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Task } from '../../models/app.types';
import { computeBurndown } from './burndown';

function makeTask(partial: Partial<Task> & Pick<Task, 'id'>): Task {
  return {
    title: partial.title ?? `Task ${partial.id}`,
    description: '',
    assigneeId: 'usr_dev',
    assigneeName: 'Dan',
    priority: partial.priority ?? 'medium',
    tags: [],
    status: partial.status ?? 'backlog',
    changeLog: [],
    createdAt: partial.createdAt ?? '2026-07-01T00:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2026-07-01T00:00:00.000Z',
    ...partial,
  };
}

describe('computeBurndown', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('drops remaining on today bucket when 1 task is done today', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T12:00:00.000Z'));

    const tasks: Task[] = [
      makeTask({
        id: 'done_today',
        status: 'done',
        updatedAt: '2026-07-25T08:00:00.000Z',
      }),
      makeTask({
        id: 'open_1',
        status: 'backlog',
        updatedAt: '2026-07-20T00:00:00.000Z',
      }),
      makeTask({
        id: 'open_2',
        status: 'in_progress',
        updatedAt: '2026-07-21T00:00:00.000Z',
      }),
    ];

    const points = computeBurndown(tasks, 7);
    expect(points).toHaveLength(7);

    const today = points[points.length - 1]!;
    const yesterday = points[points.length - 2]!;

    expect(today.date).toBe('2026-07-25');
    expect(today.completedTasks).toBe(1);
    expect(today.remainingTasks).toBe(2);
    expect(today.totalScope).toBe(3);

    expect(yesterday.completedTasks).toBe(0);
    expect(yesterday.remainingTasks).toBe(3);
  });

  it('never returns negative remainingTasks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-25T12:00:00.000Z'));

    const tasks: Task[] = [
      makeTask({
        id: 'd1',
        status: 'done',
        updatedAt: '2026-07-20T00:00:00.000Z',
      }),
      makeTask({
        id: 'd2',
        status: 'done',
        updatedAt: '2026-07-22T00:00:00.000Z',
      }),
    ];

    const points = computeBurndown(tasks, 7);
    for (const point of points) {
      expect(point.remainingTasks).toBeGreaterThanOrEqual(0);
    }
  });

  it('returns empty-scope zeros for empty task list', () => {
    const points = computeBurndown([], 7);
    expect(points).toHaveLength(7);
    expect(points.every((p) => p.totalScope === 0)).toBe(true);
    expect(points.every((p) => p.remainingTasks === 0)).toBe(true);
    expect(points.every((p) => p.completedTasks === 0)).toBe(true);
  });
});
