# 06 — UI Panels (Shell, Team, Analytics, Auth, Shared)

Реализуй все экраны и shared-компоненты. Все строки UI — через i18n. Константы размеров — Appendix A. **Запрещены** Angular Material и CDK overlay.

---

## 6.1 Файлы

| Компонент | Назначение |
|-----------|------------|
| `app.component.*` | root `<router-outlet>` |
| `shell/app-shell.component.*` | layout grid sidebar + main |
| `shell/sidebar/*` | nav links RBAC-filtered |
| `shell/topbar/*` | brand, loading, theme, lang, user menu |
| `pages/login/*` | auth login |
| `pages/register/*` | auth register |
| `components/kanban/*` | см. документ 05 |
| `components/team/team.component.*` | КАНОН: admin user table |
| `components/team/team-member-modal/*` | add/edit user |
| `components/analytics/analytics.component.*` | КАНОН: dashboard shell |
| `components/analytics/bar-chart/*` | SVG priority bars |
| `components/analytics/burndown-chart/*` | SVG line burndown |
| `shared/modal/*` | reusable modal + focus trap |
| `shared/data-table/*` | sortable paginated table |
| `shared/priority-badge/*` | colored priority pill |
| `shared/role-badge/*` | role colored pill |
| `shared/toast/*` | global toast |
| `shared/empty-state/*` | empty placeholder |
| `shared/loading-spinner/*` | inline spinner |

---

## 6.2 AppShellComponent

### Layout

```scss
.afx-shell {
  display: grid;
  grid-template-columns: var(--afx-sidebar-width) 1fr;
  grid-template-rows: 1fr;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background: var(--afx-bg-deep);
}

.afx-shell__main {
  display: grid;
  grid-template-rows: var(--afx-topbar-height) 1fr;
  overflow: hidden;
}

.afx-shell__outlet {
  overflow: auto;
  padding: 24px;
}
```

### Template

```html
<div class="afx-shell" [attr.data-theme]="ui.theme()">
  <afx-sidebar />
  <div class="afx-shell__main">
    <afx-topbar />
    <main class="afx-shell__outlet">
      <router-outlet />
    </main>
  </div>
  <afx-toast />
  @if (ui.helpOpen()) {
    <afx-help-drawer />
  }
</div>
```

---

## 6.3 SidebarComponent

Nav items:

| route | icon | labelKey | roles |
|-------|------|----------|-------|
| `/board` | board | `nav.board` | all |
| `/analytics` | chart | `nav.analytics` | admin, manager |
| `/team` | users | `nav.team` | admin |

- Active link: accent glow + `aria-current="page"`.
- Logo «ApexFlow» at top with subtle neon underline.
- Footer: version `v1.0.0` muted.

---

## 6.4 TopbarComponent

Elements (left → right):
1. Mobile menu toggle (if `< 900px` — collapse sidebar to drawer)
2. Page title from route data or computed (`board.title`, etc.)
3. Spacer
4. `@if (ui.globalLoading()) { <afx-loading-spinner size="sm" /> }`
5. Theme toggle button
6. Locale toggle (`RU` / `EN`)
7. User menu dropdown:
   - displayName + role badge
   - link profile info readonly
   - logout button
8. Help `?` button

User menu — custom dropdown (not Material); close on outside click + Escape.

---

## 6.5 Auth pages (Login / Register)

Full viewport centered layout **без** shell.

### Shared auth layout

```html
<div class="afx-auth">
  <div class="afx-auth__hero">
    <h1>ApexFlow</h1>
    <p>{{ t('auth.tagline') }}</p>
    <!-- subtle grid/noise background -->
  </div>
  <div class="afx-auth__card">
    <ng-content />
  </div>
</div>
```

Login/Register use reactive forms, field-level error messages under inputs, submit disabled while `auth.isLoading()`.

Demo credentials block (Appendix A) in `<details>` on login page.

---

## 6.6 TeamComponent (канон брифа)

**Route:** `/team`, Admin only.

### Header row
- Title `team.title`
- Search input (debounce **не обязателен** — filter on input via signal)
- Role filter select: all | admin | manager | developer
- Button «Добавить участника» → open add modal

### Data table columns

| Column | sortable | content |
|--------|----------|---------|
| Email | yes | text |
| Имя | yes | displayName |
| Роль | yes | inline `<select>` → PATCH on change |
| Статус | no | badge Active/Blocked |
| Создан | yes | formatted date |
| Actions | no | Edit, Block/Unblock |

Pagination controls below table: prev/next, page numbers, pageSize select (10/20/50).

### State signals

```ts
readonly query = signal<TeamQuery>({ page: 1, pageSize: 10, search: '', roleFilter: 'all', sortBy: 'createdAt', sortDirection: 'desc' });
readonly result = signal<PaginatedResult<UserPublic> | null>(null);
readonly loading = signal(false);
```

`effect` or `ngOnInit` + query changes → `teamService.loadUsers(query)`.

### Block/Unblock

Toggle calls `teamService.updateUser(id, { isBlocked: !user.isBlocked })`.
Cannot block seed admin (`usr_admin` id from Appendix A).

### TeamMemberModalComponent

Modes: `add` | `edit`

**Add fields:** email, displayName, password, role select
**Edit fields:** displayName, role (email readonly)

Uses `ModalComponent` wrapper. Submit → POST or PATCH. On success close + reload table + toast.

---

## 6.7 AnalyticsComponent (канон брифа)

**Route:** `/analytics`, Admin + Manager.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ KPI cards row: Total | Done | In Progress | Completion % │
├──────────────────────────┬──────────────────────────────┤
│  Bar Chart (priorities)  │  Burndown Line (7 days)      │
│  SVG                     │  SVG                         │
└──────────────────────────┴──────────────────────────────┘
```

### KPI cards (4)

Computed from `taskService.tasks()`:
- `totalTasks`
- `doneTasks` (status === done)
- `inProgressTasks` (in_progress + review)
- `completionRate = round(done / total * 100)` or 0 if total 0

### Charts

- `<afx-bar-chart [stats]="priorityStats()" />`
- `<afx-burndown-chart [points]="burndownPoints()" />`

Data from `AnalyticsService` or computed in component from tasks — **канон:** pure functions in `domain/analytics/` called via `computed`:

```ts
readonly priorityStats = computed(() => computePriorityStats(this.taskService.tasks()));
readonly burndownPoints = computed(() => computeBurndown(this.taskService.tasks(), 7));
```

Charts **must** re-render when tasks signal changes (zoneless + computed).

### Responsive

`< 900px`: KPI stack 2x2, charts stack vertical full width.

---

## 6.8 BarChartComponent

Inputs:
- `stats: PriorityStat[]`
- `width`, `height` optional (default from analytics.constants)

Renders SVG only — see Appendix B §B.1–B.3.

`role="img"` + `[attr.aria-label]="chartAriaLabel()"`.

Legend below: color swatch + label per priority.

---

## 6.9 BurndownChartComponent

Inputs:
- `points: AnalyticsPoint[]`

SVG line + area fill optional + axes + grid lines — Appendix B §B.4–B.5.

Tooltip on hover (native SVG `<title>` or positioned div) showing date + remaining count.

---

## 6.10 ModalComponent (shared)

API:

```ts
readonly open = input<boolean>(false);
readonly title = input<string>('');
readonly close = output<void>();
```

Features:
- backdrop click closes (configurable input `closeOnBackdrop`, default true)
- Escape closes
- focus trap: tab cycles inside modal
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`

Animation: backdrop opacity + panel translateY (CSS).

---

## 6.11 DataTableComponent

Generic table with:

```ts
readonly columns = input<TableColumn[]>([]);
readonly rows = input<Record<string, unknown>[]>([]);
readonly sortBy = model<string>('');
readonly sortDirection = model<SortDirection>('asc');
readonly sortChange = output<{ sortBy: string; sortDirection: SortDirection }>();
```

Emits sort events; parent handles data ordering (server-side sort in team query).

Optional pagination inputs/outputs for reuse in TeamComponent.

---

## 6.12 PriorityBadgeComponent / RoleBadgeComponent

Inputs: `priority: TaskPriority` / `role: Role`

Small pill with CSS class per enum + `t()` label.

---

## 6.13 ToastComponent

Bound to `uiStore.toastMessage()`.

Fixed bottom-right, auto-clear after `TOAST_DURATION_MS`.

Types: success (default), error (optional class if message key starts with `error.`).

---

## 6.14 EmptyStateComponent

Inputs: `titleKey`, `descriptionKey`, optional `actionLabelKey` + `action` output.

Used in empty kanban columns, empty team search, empty chart edge case.

---

## 6.15 Help drawer (optional but recommended)

Slide-over from right listing hotkeys from Appendix A §A.10.

Toggle `ui.helpOpen` via `?` hotkey and topbar button.

---

## 6.16 i18n keys (minimum per screen)

### nav.*
`nav.board`, `nav.analytics`, `nav.team`

### auth.*
`auth.login.title`, `auth.register.title`, `auth.tagline`, `auth.email`, `auth.password`, `auth.displayName`, `auth.confirmPassword`, `auth.acceptTerms`, `auth.submit.login`, `auth.submit.register`, `auth.error.*`, `auth.demoCredentials`

### board.*
`board.title`, `board.newTask`, `board.column.*`, `board.filter.*`, `board.detail.*`, `board.deleteConfirm`

### team.*
`team.title`, `team.search`, `team.addMember`, `team.column.*`, `team.block`, `team.unblock`, `team.active`, `team.blocked`

### analytics.*
`analytics.title`, `analytics.kpi.*`, `analytics.chart.priorities`, `analytics.chart.burndown`, `analytics.chart.aria.*`

### common.*
`common.save`, `common.cancel`, `common.delete`, `common.loading`, `common.logout`

---

## 6.17 Responsive breakpoints

| Breakpoint | Behavior |
|------------|----------|
| `< 900px` | Sidebar → overlay drawer; kanban horizontal scroll |
| `< 600px` | Auth card full width; KPI 1 column |
| `≥ 1200px` | Kanban 4 columns equal width |

---

## 6.18 Z-index stack

| Layer | z-index |
|-------|---------|
| shell | 0 |
| sidebar drawer mobile | 50 |
| task detail drawer | 100 |
| modal | 1000 |
| toast | 1100 |
| drag ghost | 999 |

Constants in `ui.constants.ts`.
