# Appendix B — Formulas & Chart Algorithms

Справочник алгоритмов аналитики и вспомогательных auth/token формул. Реализации — в `domain/analytics/**` и `domain/auth/**` согласно [04-auth-rbac.md](04-auth-rbac.md), [05-kanban-board.md](05-kanban-board.md), [06-ui-panels.md](06-ui-panels.md).

---

## B.1 Обозначения

| Symbol | Meaning |
|--------|---------|
| \(T\) | множество всех задач |
| \(T_d\) | задачи со `status === 'done'` |
| \(T_o\) | задачи не done |
| \(P\) | множество приоритетов `{ high, medium, low }` |
| \(D\) | число дней burndown (`BURNDOWN_DAYS = 7`) |
| \(W, H\) | width/height chart (`CHART_WIDTH`, `CHART_HEIGHT`) |
| padding | `top, right, bottom, left` from Appendix A |

Plot area:

```
plotWidth  = W - paddingLeft - paddingRight
plotHeight = H - paddingTop - paddingBottom
```

---

## B.2 Priority distribution (Bar Chart)

### Counting

```
count(priority):
  return |{ t ∈ T : t.priority === priority }|

priorityStats = [
  { priority: 'high',   count: count('high'),   labelKey: 'priority.high' },
  { priority: 'medium', count: count('medium'), labelKey: 'priority.medium' },
  { priority: 'low',    count: count('low'),    labelKey: 'priority.low' },
]
```

### Scale Y

```
maxCount = max(priorityStats.map(s => s.count), default 1)

scaleY(value):
  return paddingTop + plotHeight - (value / maxCount) * plotHeight
```

### Bar geometry

For `n = 3` bars:

```
barWidth = (plotWidth - BAR_GAP * (n - 1)) / n

barX(index):
  return paddingLeft + index * (barWidth + BAR_GAP)

barRect(stat, index):
  x = barX(index)
  y = scaleY(stat.count)
  width = barWidth
  height = paddingTop + plotHeight - y   // if count==0, height=0, y=baseline
```

Return model:

```ts
interface BarChartModel {
  viewBox: string;           // `0 0 ${W} ${H}`
  bars: { x: number; y: number; width: number; height: number; priority: TaskPriority; count: number }[];
  yTicks: { y: number; label: string }[];
  xLabels: { x: number; y: number; labelKey: string }[];
  baselineY: number;
}
```

Y ticks: 0, ceil(maxCount/2), maxCount (if maxCount > 1).

---

## B.3 Bar chart SVG render (component)

Template pattern:

```html
<svg [attr.viewBox]="model.viewBox" preserveAspectRatio="xMidYMid meet">
  @for (tick of model.yTicks; track tick.label) {
    <line [attr.x1]="paddingLeft" [attr.x2]="W - paddingRight" ... />
    <text>{{ tick.label }}</text>
  }
  <line class="baseline" [attr.x1]="paddingLeft" [attr.x2]="W - paddingRight" [attr.y1]="model.baselineY" [attr.y2]="model.baselineY" />
  @for (bar of model.bars; track bar.priority) {
    <rect [attr.x]="bar.x" [attr.y]="bar.y" [attr.width]="bar.width" [attr.height]="bar.height" [class]="'afx-bar--' + bar.priority">
      <title>{{ bar.count }}</title>
    </rect>
  }
  @for (label of model.xLabels; track label.labelKey) {
    <text [attr.x]="label.x" [attr.y]="label.y">{{ t(label.labelKey) }}</text>
  }
</svg>
```

---

## B.4 Burndown — date buckets

### Date keys

```
today = startOfDay(now)
dates = [ today - (D-1) days, ..., today ]  // D points, inclusive

toDateKey(isoString):
  return isoString.slice(0, 10)   // YYYY-MM-DD in local or UTC — канон: UTC slice for consistency
```

### Scope at start of period

```
totalScope = |T|   // all tasks at snapshot time (v1 simplification)

// Alternative canonical: tasks that existed at period start — for v1 use current totalScope constant across period
```

### Cumulative done by date

```
doneByEndOfDay(dateKey):
  return |{ t ∈ T_d : toDateKey(t.updatedAt) <= dateKey }|

remaining(dateKey):
  return totalScope - doneByEndOfDay(dateKey)
  // clamp min 0
```

### AnalyticsPoint array

```
burndownPoints = dates.map(dateKey => ({
  date: dateKey,
  totalScope,
  completedTasks: doneByEndOfDay(dateKey),
  remainingTasks: remaining(dateKey),
}))
```

---

## B.5 Burndown line chart geometry

### Scales

```
maxY = max(burndownPoints.map(p => p.remainingTasks), default 1)

scaleX(index):
  return paddingLeft + (index / (D - 1)) * plotWidth   // if D==1, center

scaleY(value):
  return paddingTop + plotHeight - (value / maxY) * plotHeight
```

### Line path

```
points = burndownPoints.map((p, i) => ({ x: scaleX(i), y: scaleY(p.remainingTasks) }))

linePath:
  if points.empty: return ''
  M x0 y0 + for i=1..n: L xi yi

// Optional area fill under line to baseline:
areaPath = linePath + L xLast baseline L x0 baseline Z
```

Return model:

```ts
interface BurndownChartModel {
  viewBox: string;
  linePath: string;
  areaPath?: string;
  dots: { cx: number; cy: number; date: string; remaining: number }[];
  xTicks: { x: number; label: string }[];
  yTicks: { y: number; label: string }[];
}
```

X tick labels: short date `DD.MM` from dateKey.

---

## B.6 buildAnalyticsSummary

```ts
export function buildAnalyticsSummary(tasks: Task[]): AnalyticsSummary {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'review').length;
  const completionRate = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
  const priorityStats = computePriorityStats(tasks);
  const burndownPoints = computeBurndown(tasks, BURNDOWN_DAYS);
  return { totalTasks, doneTasks, inProgressTasks, overdueEstimate: 0, priorityStats, burndownPoints, completionRate };
}
```

`overdueEstimate` v1: optional count backlog tasks with `createdAt` older than 7 days.

---

## B.7 Token helpers (mock JWT-like)

```ts
export function generateToken(userId: string): string {
  const random = cryptoRandomString(32);
  return TOKEN_PREFIX + userId + '_' + random;
}

export function parseTokenUserId(token: string): string | null {
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  const rest = token.slice(TOKEN_PREFIX.length);
  const userId = rest.split('_')[0]; // usr_admin from usr_admin_abc...
  // канон: token format TOKEN_PREFIX + userId + '_' + random
  // better: TOKEN_PREFIX + base64(userId + timestamp) — pick one and test
}
```

**Канон v1 (простой):** store `sessions: Map<token, userId>` on login; parseToken looks up map — **не** decode userId from token string required if map used. Still implement `generateToken()` unique per login.

---

## B.8 Password hash (demo)

```
hashPassword(plain):
  return btoa(PASSWORD_SALT + ':' + plain)   // or TextEncoder + base64 in Node tests

verifyPassword(plain, hash):
  return hashPassword(plain) === hash
```

---

## B.9 Auth session expiry

```
expiresAt = now + SESSION_TTL_DAYS days (ISO string)

isSessionValid(session):
  return new Date(session.expiresAt) > new Date()
```

---

## B.10 Pagination helper (team API)

```
totalPages = ceil(total / pageSize)

slice(items, page, pageSize):
  start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
```

Server-side mock: filter users by search (email/displayName contains, case-insensitive) → filter by role → sort → paginate.

---

## B.11 DnD hit-test (reference)

```
findColumnIdFromPoint(x, y, columnElements):
  el = document.elementFromPoint(x, y)
  if !el: return null
  columnEl = el.closest('[data-column-id]')
  if !columnEl: return null
  return columnEl.getAttribute('data-column-id') as ColumnId
```

---

## B.12 Responsive SVG

Host CSS:

```scss
.afx-chart svg {
  width: 100%;
  height: auto;
  max-height: 320px;
}
```

viewBox fixed (480×280); scaling via CSS — **не** пересчитывать model on resize in v1.

---

## B.13 Test oracles

### chart-builder.spec.ts

- Given 6 tasks: 2 high, 2 medium, 2 low → bar heights proportional
- maxCount=0 edge → flat baseline, no NaN
- burndown 7 points always length 7
- moving task to done yesterday increases `completedTasks` for subsequent days

### burndown.spec.ts

- 1 task done today → remaining drops on today bucket only
- remaining never negative
