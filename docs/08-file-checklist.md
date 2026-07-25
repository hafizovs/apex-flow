# 08 — File Checklist

Генератор **обязан** создать каждый файл из списка. Отмечай мысленно ☑. Пропуск файла = провал DoD.

Рядом с путём — краткое содержание (1–2 предложения). Код внутри файла — **полный**, без сокращений.

---

## 8.1 Project root / Angular scaffold

| # | Path | Content |
|---|------|---------|
| 1 | `package.json` | Имя `apex-flow`, scripts start/build/test; tailwind deps если выбран Tailwind |
| 2 | `angular.json` | project config, styles `src/styles.scss` |
| 3 | `tsconfig.json` | base TS config |
| 4 | `tsconfig.app.json` | app TS config |
| 5 | `tsconfig.spec.json` | spec TS config |
| 6 | `src/index.html` | title ApexFlow, fonts DM Sans + JetBrains Mono, root element |
| 7 | `src/main.ts` | bootstrapApplication |
| 8 | `src/styles.scss` | CSS variables Cyberpunk Minimal SaaS, reset, full viewport |
| 9 | `README.md` | install, start, test, demo credentials, RBAC, hotkeys |
| 10 | `tailwind.config.js` / эквивалент | **только если** выбран Tailwind — полный конфиг content/theme |

---

## 8.2 App shell & routing (канон брифа)

| # | Path | Content |
|---|------|---------|
| 11 | `src/app/app.config.ts` | zoneless, router, httpClient + interceptor |
| 12 | `src/app/app.routes.ts` | КАНОН: lazy routes, guards, shell children |
| 13 | `src/app/app.component.ts` | root host router-outlet |
| 14 | `src/app/app.component.html` | `<router-outlet />` |
| 15 | `src/app/app.component.scss` | minimal host styles |

---

## 8.3 Models (канон брифа)

| # | Path | Content |
|---|------|---------|
| 16 | `src/app/models/app.types.ts` | КАНОН: User, Task, Role, Column, AnalyticsPoint, AuthSession, all interfaces |

---

## 8.4 Core constants

| # | Path | Content |
|---|------|---------|
| 17 | `src/app/core/constants/auth.constants.ts` | SESSION_STORAGE_KEY, SALT, token prefix, session TTL |
| 18 | `src/app/core/constants/kanban.constants.ts` | COLUMN_DEFINITIONS, max title/tags |
| 19 | `src/app/core/constants/analytics.constants.ts` | chart width/height, padding, colors |
| 20 | `src/app/core/constants/ui.constants.ts` | sidebar width, modal z, toast ms, breakpoints |
| 21 | `src/app/core/constants/api.constants.ts` | NETWORK_DELAY_MS=800, API base paths |

---

## 8.5 Core models

| # | Path | Content |
|---|------|---------|
| 22 | `src/app/core/models/role.model.ts` | Role type + helpers |
| 23 | `src/app/core/models/task-status.model.ts` | TaskStatus / ColumnId |
| 24 | `src/app/core/models/task-priority.model.ts` | TaskPriority |
| 25 | `src/app/core/models/theme.model.ts` | ThemeId |
| 26 | `src/app/core/models/locale.model.ts` | LocaleId |

---

## 8.6 Domain auth / kanban / analytics / shared

| # | Path | Content |
|---|------|---------|
| 27 | `src/app/domain/auth/email.validators.ts` | email format validator |
| 28 | `src/app/domain/auth/password.validators.ts` | strength + confirm match |
| 29 | `src/app/domain/auth/token.helpers.ts` | generateToken, parseToken |
| 30 | `src/app/domain/auth/token.helpers.spec.ts` | token tests |
| 31 | `src/app/domain/kanban/column-order.ts` | COLUMN_DEFINITIONS + buildKanbanColumns |
| 32 | `src/app/domain/kanban/task-filters.ts` | applyTaskFilters |
| 33 | `src/app/domain/kanban/task-filters.spec.ts` | filter tests |
| 34 | `src/app/domain/kanban/dnd.helpers.ts` | hit-test, canDrop |
| 35 | `src/app/domain/kanban/dnd.helpers.spec.ts` | dnd tests |
| 36 | `src/app/domain/analytics/priority-stats.ts` | computePriorityStats |
| 37 | `src/app/domain/analytics/burndown.ts` | computeBurndown |
| 38 | `src/app/domain/analytics/chart-builder.ts` | buildBarChartModel, buildBurndownChartModel |
| 39 | `src/app/domain/analytics/chart-builder.spec.ts` | chart model tests |
| 40 | `src/app/domain/shared/id-factory.ts` | createId prefix usr/tsk/log |
| 41 | `src/app/domain/shared/date.helpers.ts` | formatDate, toDateKey YYYY-MM-DD |

---

## 8.7 State stores

| # | Path | Content |
|---|------|---------|
| 42 | `src/app/state/auth.store.ts` | optional thin session signals or re-export |
| 43 | `src/app/state/task.store.ts` | optional task signals or re-export |
| 44 | `src/app/state/ui.store.ts` | theme, locale, toast, help, globalLoading, selectedTaskId |

---

## 8.8 Services (канон брифа + infra)

| # | Path | Content |
|---|------|---------|
| 45 | `src/app/services/auth.service.ts` | КАНОН: login/register/logout, session signals, persist |
| 46 | `src/app/services/auth.service.spec.ts` | auth tests |
| 47 | `src/app/services/task.service.ts` | КАНОН: tasks CRUD, filters, columns computed |
| 48 | `src/app/services/task.service.spec.ts` | task tests |
| 49 | `src/app/services/team.service.ts` | users pagination CRUD |
| 50 | `src/app/services/analytics.service.ts` | computed summary facade |
| 51 | `src/app/services/i18n.service.ts` | t() + locale signal |
| 52 | `src/app/services/hotkeys.service.ts` | keyboard shortcuts |
| 53 | `src/app/services/clipboard.service.ts` | optional copyText helper |

---

## 8.9 Interceptors & guards

| # | Path | Content |
|---|------|---------|
| 54 | `src/app/interceptors/mock-api.interceptor.ts` | КАНОН: delay 800ms, Bearer, REST router |
| 55 | `src/app/interceptors/mock-api.interceptor.spec.ts` | interceptor tests |
| 56 | `src/app/interceptors/mock-db.ts` | in-memory seed DB, reset, helpers |
| 57 | `src/app/guards/auth.guard.ts` | CanActivateFn authenticated |
| 58 | `src/app/guards/role.guard.ts` | CanActivateFn RBAC |
| 59 | `src/app/guards/auth.guard.spec.ts` | auth guard tests |
| 60 | `src/app/guards/role.guard.spec.ts` | role guard tests |

---

## 8.10 Pages (auth)

| # | Path | Content |
|---|------|---------|
| 61 | `src/app/pages/login/login.page.ts` | login form + authService.login |
| 62 | `src/app/pages/login/login.page.html` | split auth layout |
| 63 | `src/app/pages/login/login.page.scss` | auth styles |
| 64 | `src/app/pages/register/register.page.ts` | register form + validators |
| 65 | `src/app/pages/register/register.page.html` | register markup |
| 66 | `src/app/pages/register/register.page.scss` | register styles |

---

## 8.11 Shell components

| # | Path | Content |
|---|------|---------|
| 67 | `src/app/components/shell/app-shell.component.ts` | sidebar + topbar + outlet grid |
| 68 | `src/app/components/shell/app-shell.component.html` | shell layout |
| 69 | `src/app/components/shell/app-shell.component.scss` | shell styles |
| 70 | `src/app/components/shell/sidebar/sidebar.component.ts` | RBAC nav |
| 71 | `src/app/components/shell/sidebar/sidebar.component.html` | nav links |
| 72 | `src/app/components/shell/sidebar/sidebar.component.scss` | sidebar styles |
| 73 | `src/app/components/shell/topbar/topbar.component.ts` | theme/lang/user/logout |
| 74 | `src/app/components/shell/topbar/topbar.component.html` | topbar markup |
| 75 | `src/app/components/shell/topbar/topbar.component.scss` | topbar styles |

---

## 8.12 Kanban (канон брифа)

| # | Path | Content |
|---|------|---------|
| 76 | `src/app/components/kanban/kanban.component.ts` | КАНОН: board + DnD orchestration |
| 77 | `src/app/components/kanban/kanban.component.html` | columns + ghost + detail |
| 78 | `src/app/components/kanban/kanban.component.scss` | board layout horizontal scroll |
| 79 | `src/app/components/kanban/kanban-column/kanban-column.component.ts` | drop zone column |
| 80 | `src/app/components/kanban/kanban-column/kanban-column.component.html` | column header + cards |
| 81 | `src/app/components/kanban/kanban-column/kanban-column.component.scss` | column styles |
| 82 | `src/app/components/kanban/task-card/task-card.component.ts` | card + drag handle |
| 83 | `src/app/components/kanban/task-card/task-card.component.html` | card markup |
| 84 | `src/app/components/kanban/task-card/task-card.component.scss` | card styles |
| 85 | `src/app/components/kanban/task-detail/task-detail.component.ts` | drawer detail + changeLog |
| 86 | `src/app/components/kanban/task-detail/task-detail.component.html` | detail markup |
| 87 | `src/app/components/kanban/task-detail/task-detail.component.scss` | drawer styles |
| 88 | `src/app/components/kanban/kanban-filters/kanban-filters.component.ts` | assignee/priority filters |
| 89 | `src/app/components/kanban/kanban-filters/kanban-filters.component.html` | filter controls |
| 90 | `src/app/components/kanban/kanban-filters/kanban-filters.component.scss` | filter styles |

---

## 8.13 Team (канон брифа)

| # | Path | Content |
|---|------|---------|
| 91 | `src/app/components/team/team.component.ts` | КАНОН: admin table pagination search |
| 92 | `src/app/components/team/team.component.html` | table + pagination |
| 93 | `src/app/components/team/team.component.scss` | team page styles |
| 94 | `src/app/components/team/team-member-modal/team-member-modal.component.ts` | add/edit user modal |
| 95 | `src/app/components/team/team-member-modal/team-member-modal.component.html` | modal form |
| 96 | `src/app/components/team/team-member-modal/team-member-modal.component.scss` | modal styles |

---

## 8.14 Analytics (канон брифа)

| # | Path | Content |
|---|------|---------|
| 97 | `src/app/components/analytics/analytics.component.ts` | КАНОН: KPI + charts layout |
| 98 | `src/app/components/analytics/analytics.component.html` | dashboard grid |
| 99 | `src/app/components/analytics/analytics.component.scss` | analytics styles |
| 100 | `src/app/components/analytics/bar-chart/bar-chart.component.ts` | SVG bar chart render |
| 101 | `src/app/components/analytics/bar-chart/bar-chart.component.html` | svg rects + axes |
| 102 | `src/app/components/analytics/bar-chart/bar-chart.component.scss` | chart styles |
| 103 | `src/app/components/analytics/burndown-chart/burndown-chart.component.ts` | SVG line burndown |
| 104 | `src/app/components/analytics/burndown-chart/burndown-chart.component.html` | svg path + axes |
| 105 | `src/app/components/analytics/burndown-chart/burndown-chart.component.scss` | chart styles |

---

## 8.15 Shared components

| # | Path | Content |
|---|------|---------|
| 106 | `src/app/components/shared/modal/modal.component.ts` | reusable modal focus trap |
| 107 | `src/app/components/shared/modal/modal.component.html` | backdrop + panel |
| 108 | `src/app/components/shared/modal/modal.component.scss` | modal animation |
| 109 | `src/app/components/shared/data-table/data-table.component.ts` | sortable table |
| 110 | `src/app/components/shared/data-table/data-table.component.html` | table markup |
| 111 | `src/app/components/shared/data-table/data-table.component.scss` | table styles |
| 112 | `src/app/components/shared/priority-badge/priority-badge.component.ts` | priority pill |
| 113 | `src/app/components/shared/priority-badge/priority-badge.component.html` | badge markup |
| 114 | `src/app/components/shared/priority-badge/priority-badge.component.scss` | badge colors |
| 115 | `src/app/components/shared/role-badge/role-badge.component.ts` | role pill |
| 116 | `src/app/components/shared/role-badge/role-badge.component.html` | badge markup |
| 117 | `src/app/components/shared/role-badge/role-badge.component.scss` | badge colors |
| 118 | `src/app/components/shared/toast/toast.component.ts` | toast host |
| 119 | `src/app/components/shared/toast/toast.component.html` | toast markup |
| 120 | `src/app/components/shared/toast/toast.component.scss` | toast styles |
| 121 | `src/app/components/shared/empty-state/empty-state.component.ts` | empty placeholder |
| 122 | `src/app/components/shared/empty-state/empty-state.component.html` | empty markup |
| 123 | `src/app/components/shared/empty-state/empty-state.component.scss` | empty styles |
| 124 | `src/app/components/shared/loading-spinner/loading-spinner.component.ts` | spinner |
| 125 | `src/app/components/shared/loading-spinner/loading-spinner.component.html` | spinner markup |
| 126 | `src/app/components/shared/loading-spinner/loading-spinner.component.scss` | spinner animation |
| 127 | `src/app/components/shared/help-drawer/help-drawer.component.ts` | hotkeys help |
| 128 | `src/app/components/shared/help-drawer/help-drawer.component.html` | help content |
| 129 | `src/app/components/shared/help-drawer/help-drawer.component.scss` | drawer styles |

---

## 8.16 i18n

| # | Path | Content |
|---|------|---------|
| 130 | `src/app/i18n/locale.type.ts` | LocaleId |
| 131 | `src/app/i18n/i18n.keys.ts` | all keys union |
| 132 | `src/app/i18n/ru.ts` | Russian dictionary complete |
| 133 | `src/app/i18n/en.ts` | English dictionary complete |

---

## 8.17 Итого

Минимум **133** файла из таблиц (+ tailwind config при выборе Tailwind). Канонические пути из брифа пользователя входят в список и **не могут** быть переименованы:

- `models/app.types.ts`
- `services/auth.service.ts`
- `services/task.service.ts`
- `interceptors/mock-api.interceptor.ts`
- `components/kanban/kanban.component.ts`
- `components/analytics/analytics.component.ts`
- `components/team/team.component.ts`
- `app.routes.ts`
