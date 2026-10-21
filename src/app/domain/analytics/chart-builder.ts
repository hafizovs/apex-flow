import {
  BAR_GAP,
  BURNDOWN_DAYS,
  CHART_HEIGHT,
  CHART_PADDING_BOTTOM,
  CHART_PADDING_LEFT,
  CHART_PADDING_RIGHT,
  CHART_PADDING_TOP,
  CHART_WIDTH,
} from '../../core/constants/analytics.constants';
import type {
  AnalyticsPoint,
  AnalyticsSummary,
  PriorityStat,
  Task,
  TaskPriority,
} from '../../core/models/app.types';
import { formatDateKeyShort } from '../shared/date.helpers';
import { computeBurndown } from './burndown';
import { computePriorityStats } from './priority-stats';

export interface BarChartModel {
  viewBox: string;
  bars: {
    x: number;
    y: number;
    width: number;
    height: number;
    priority: TaskPriority;
    count: number;
  }[];
  yTicks: { y: number; label: string }[];
  xLabels: { x: number; y: number; labelKey: string }[];
  baselineY: number;
}

export interface BurndownChartModel {
  viewBox: string;
  linePath: string;
  areaPath?: string;
  dots: { cx: number; cy: number; date: string; remaining: number }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
}

const plotWidth = CHART_WIDTH - CHART_PADDING_LEFT - CHART_PADDING_RIGHT;
const plotHeight = CHART_HEIGHT - CHART_PADDING_TOP - CHART_PADDING_BOTTOM;

function baselineY(): number {
  return CHART_PADDING_TOP + plotHeight;
}

export function buildBarChartModel(stats: PriorityStat[]): BarChartModel {
  const n = stats.length || 1;
  const maxCount = Math.max(...stats.map((s) => s.count), 0);
  const safeMax = maxCount === 0 ? 1 : maxCount;

  const barWidth = (plotWidth - BAR_GAP * (n - 1)) / n;

  const scaleY = (value: number): number =>
    CHART_PADDING_TOP + plotHeight - (value / safeMax) * plotHeight;

  const bars = stats.map((stat, index) => {
    const x = CHART_PADDING_LEFT + index * (barWidth + BAR_GAP);
    if (stat.count === 0) {
      return {
        x,
        y: baselineY(),
        width: barWidth,
        height: 0,
        priority: stat.priority,
        count: 0,
      };
    }
    const y = scaleY(stat.count);
    return {
      x,
      y,
      width: barWidth,
      height: baselineY() - y,
      priority: stat.priority,
      count: stat.count,
    };
  });

  const tickValues =
    maxCount <= 1 ? [0, maxCount] : [0, Math.ceil(maxCount / 2), maxCount];

  const yTicks = tickValues.map((value) => ({
    y: scaleY(value),
    label: String(value),
  }));

  const xLabels = stats.map((stat, index) => ({
    x: CHART_PADDING_LEFT + index * (barWidth + BAR_GAP) + barWidth / 2,
    y: CHART_HEIGHT - 12,
    labelKey: stat.labelKey,
  }));

  return {
    viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
    bars,
    yTicks,
    xLabels,
    baselineY: baselineY(),
  };
}

export function buildBurndownChartModel(
  points: AnalyticsPoint[],
): BurndownChartModel {
  const d = points.length || 1;
  const maxY = Math.max(...points.map((p) => p.remainingTasks), 0);
  const safeMaxY = maxY === 0 ? 1 : maxY;

  const scaleX = (index: number): number => {
    if (d === 1) {
      return CHART_PADDING_LEFT + plotWidth / 2;
    }
    return CHART_PADDING_LEFT + (index / (d - 1)) * plotWidth;
  };

  const scaleY = (value: number): number =>
    CHART_PADDING_TOP + plotHeight - (value / safeMaxY) * plotHeight;

  const coords = points.map((p, i) => ({
    x: scaleX(i),
    y: scaleY(p.remainingTasks),
    date: p.date,
    remaining: p.remainingTasks,
  }));

  let linePath = '';
  if (coords.length > 0) {
    linePath =
      `M ${coords[0]!.x} ${coords[0]!.y}` +
      coords
        .slice(1)
        .map((c) => ` L ${c.x} ${c.y}`)
        .join('');
  }

  const baseY = baselineY();
  let areaPath: string | undefined;
  if (coords.length > 0 && linePath) {
    const last = coords[coords.length - 1]!;
    const first = coords[0]!;
    areaPath = `${linePath} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
  }

  const yTickValues = maxY <= 1 ? [0, maxY] : [0, Math.ceil(maxY / 2), maxY];

  const yTicks = yTickValues.map((value) => ({
    y: scaleY(value),
    label: String(value),
  }));

  const xTicks = points.map((p, i) => ({
    x: scaleX(i),
    label: formatDateKeyShort(p.date),
  }));

  return {
    viewBox: `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`,
    linePath,
    areaPath,
    dots: coords.map((c) => ({
      cx: c.x,
      cy: c.y,
      date: c.date,
      remaining: c.remaining,
    })),
    xTicks,
    yTicks,
  };
}

export function buildAnalyticsSummary(tasks: Task[]): AnalyticsSummary {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'review',
  ).length;
  const completionRate =
    totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const overdueEstimate = tasks.filter((t) => {
    if (t.status !== 'backlog') {
      return false;
    }
    return new Date(t.createdAt).getTime() < sevenDaysAgo;
  }).length;

  const priorityStats = computePriorityStats(tasks);
  const burndownPoints = computeBurndown(tasks, BURNDOWN_DAYS);

  return {
    totalTasks,
    doneTasks,
    inProgressTasks,
    overdueEstimate,
    priorityStats,
    burndownPoints,
    completionRate,
  };
}
