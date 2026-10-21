import { BURNDOWN_DAYS } from '../../core/constants/analytics.constants';
import type { AnalyticsPoint, Task } from '../../core/models/app.types';
import { addDays, startOfDayUtc, toDateKey } from '../shared/date.helpers';

/**
 * Burndown over the last `days` UTC midnights (inclusive of today).
 * Appendix B §B.4
 */
export function computeBurndown(
  tasks: Task[],
  days: number = BURNDOWN_DAYS,
): AnalyticsPoint[] {
  const d = Math.max(1, days);
  const today = startOfDayUtc(new Date());
  const totalScope = tasks.length;

  const dates: string[] = [];
  for (let i = d - 1; i >= 0; i--) {
    dates.push(toDateKey(addDays(today, -i)));
  }

  const doneTasks = tasks.filter((t) => t.status === 'done');

  return dates.map((dateKey) => {
    const completedTasks = doneTasks.filter(
      (t) => toDateKey(t.updatedAt) <= dateKey,
    ).length;
    const remainingTasks = Math.max(0, totalScope - completedTasks);
    return {
      date: dateKey,
      totalScope,
      completedTasks,
      remainingTasks,
    };
  });
}
