import { describe, it, expect, vi, afterEach } from 'vitest';
import type { PriorityStat, Task } from '../../core/models/app.types';
import { BURNDOWN_DAYS } from '../../core/constants/analytics.constants';
import {
  buildAnalyticsSummary,
  buildBarChartModel,
  buildBurndownChartModel,
} from './chart-builder';
import { computePriorityStats } from './priority-stats';
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

describe('chart-builder', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('buildBarChartModel', () => {
    it('builds proportional bar heights for equal priority counts', () => {
      const tasks: Task[] = [
        makeTask({ id: '1', priority: 'high' }),
        makeTask({ id: '2', priority: 'high' }),
        makeTask({ id: '3', priority: 'medium' }),
        makeTask({ id: '4', priority: 'medium' }),
        makeTask({ id: '5', priority: 'low' }),
        makeTask({ id: '6', priority: 'low' }),
      ];
      const stats = computePriorityStats(tasks);
      const model = buildBarChartModel(stats);

      expect(model.bars).toHaveLength(3);
      expect(model.bars.every((b) => b.count === 2)).toBe(true);
      const heights = model.bars.map((b) => b.height);
      expect(heights[0]).toBe(heights[1]);
      expect(heights[1]).toBe(heights[2]);
      expect(heights[0]).toBeGreaterThan(0);
      expect(Number.isNaN(heights[0]!)).toBe(false);
    });

    it('handles maxCount=0 without NaN (flat baseline)', () => {
      const emptyStats: PriorityStat[] = [
        { priority: 'high', count: 0, labelKey: 'priority.high' },
        { priority: 'medium', count: 0, labelKey: 'priority.medium' },
        { priority: 'low', count: 0, labelKey: 'priority.low' },
      ];
      const model = buildBarChartModel(emptyStats);
      expect(model.bars.every((b) => b.height === 0)).toBe(true);
      expect(model.bars.every((b) => !Number.isNaN(b.y))).toBe(true);
      expect(model.baselineY).toBeGreaterThan(0);
    });

    it('includes viewBox matching chart constants', () => {
      const model = buildBarChartModel(computePriorityStats([]));
      expect(model.viewBox).toBe('0 0 480 280');
    });
  });

  describe('buildBurndownChartModel / burndown length', () => {
    it('always produces 7 burndown points', () => {
      const tasks = [makeTask({ id: 'a' }), makeTask({ id: 'b' })];
      const points = computeBurndown(tasks, BURNDOWN_DAYS);
      expect(points).toHaveLength(7);
      const model = buildBurndownChartModel(points);
      expect(model.dots).toHaveLength(7);
      expect(model.linePath.startsWith('M ')).toBe(true);
    });

    it('increases completedTasks for subsequent days when task done yesterday', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-25T12:00:00.000Z'));

      const yesterday = '2026-07-24T15:00:00.000Z';
      const tasks: Task[] = [
        makeTask({
          id: 'done_y',
          status: 'done',
          updatedAt: yesterday,
        }),
        makeTask({
          id: 'open',
          status: 'backlog',
          updatedAt: '2026-07-20T00:00:00.000Z',
        }),
      ];

      const points = computeBurndown(tasks, 7);
      const idxYesterday = points.findIndex((p) => p.date === '2026-07-24');
      const idxToday = points.findIndex((p) => p.date === '2026-07-25');
      expect(idxYesterday).toBeGreaterThanOrEqual(0);
      expect(idxToday).toBeGreaterThan(idxYesterday);

      expect(points[idxYesterday]!.completedTasks).toBe(1);
      expect(points[idxToday]!.completedTasks).toBe(1);

      const beforeYesterday = points[idxYesterday - 1];
      if (beforeYesterday) {
        expect(beforeYesterday.completedTasks).toBe(0);
        expect(beforeYesterday.remainingTasks).toBeGreaterThan(
          points[idxYesterday]!.remainingTasks,
        );
      }
    });
  });

  describe('buildAnalyticsSummary', () => {
    it('computes KPIs and completionRate', () => {
      const tasks: Task[] = [
        makeTask({ id: '1', status: 'done', priority: 'high' }),
        makeTask({ id: '2', status: 'done', priority: 'low' }),
        makeTask({ id: '3', status: 'in_progress', priority: 'medium' }),
        makeTask({ id: '4', status: 'review', priority: 'high' }),
        makeTask({ id: '5', status: 'backlog', priority: 'low' }),
      ];
      const summary = buildAnalyticsSummary(tasks);
      expect(summary.totalTasks).toBe(5);
      expect(summary.doneTasks).toBe(2);
      expect(summary.inProgressTasks).toBe(2);
      expect(summary.completionRate).toBe(40);
      expect(summary.burndownPoints).toHaveLength(7);
      expect(summary.priorityStats).toHaveLength(3);
    });
  });
});
