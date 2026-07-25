# Appendix A — Defaults, Ranges & Seed Data

Справочник чисел, seed-пользователей, seed-задач и UI-констант. Реализации копируют значения в `core/constants/*` и `interceptors/mock-db.ts` **без округления «на глаз»**.

---

## A.1 Auth / API

| Константа | Значение |
|-----------|----------|
| `SESSION_STORAGE_KEY` | `'afx_session'` |
| `LOCALE_STORAGE_KEY` | `'afx_locale'` |
| `THEME_STORAGE_KEY` | `'afx_theme'` |
| `NETWORK_DELAY_MS` | `800` |
| `SESSION_TTL_DAYS` | `7` |
| `PASSWORD_SALT` | `'afx-demo-salt-v1'` |
| `TOKEN_PREFIX` | `'afx_tok_'` |
| `ID_PREFIX_USER` | `'usr_'` |
| `ID_PREFIX_TASK` | `'tsk_'` |
| `ID_PREFIX_LOG` | `'log_'` |
| `DEFAULT_LOCALE` | `'ru'` |
| `DEFAULT_THEME` | `'dark'` |
| `MAX_TASK_TITLE` | `120` |
| `MAX_TASK_DESCRIPTION` | `4000` |
| `MAX_TAGS` | `8` |
| `MAX_TAG_LENGTH` | `24` |

---

## A.2 UI layout

| Константа | Значение |
|-----------|----------|
| `SIDEBAR_WIDTH_PX` | `240` |
| `TOPBAR_HEIGHT_PX` | `56` |
| `MODAL_Z_INDEX` | `1000` |
| `TOAST_Z_INDEX` | `1100` |
| `DRAG_GHOST_Z_INDEX` | `999` |
| `TOAST_DURATION_MS` | `2500` |
| `RESPONSIVE_BREAKPOINT_PX` | `900` |
| `TASK_DETAIL_DRAWER_WIDTH_PX` | `420` |
| `DEFAULT_PAGE_SIZE` | `10` |
| `PAGE_SIZE_OPTIONS` | `[10, 20, 50]` |

CSS:

```scss
:root {
  --afx-sidebar-width: 240px;
  --afx-topbar-height: 56px;
}
```

---

## A.3 Analytics chart defaults

| Константа | Значение |
|-----------|----------|
| `CHART_WIDTH` | `480` |
| `CHART_HEIGHT` | `280` |
| `CHART_PADDING_TOP` | `24` |
| `CHART_PADDING_RIGHT` | `24` |
| `CHART_PADDING_BOTTOM` | `40` |
| `CHART_PADDING_LEFT` | `48` |
| `BAR_GAP` | `16` |
| `BURNDOWN_DAYS` | `7` |

Priority colors (match CSS variables):

| Priority | Color variable |
|----------|----------------|
| high | `--afx-priority-high` (#ff4466) |
| medium | `--afx-priority-medium` (#ffb020) |
| low | `--afx-priority-low` (#00e5ff) |

---

## A.4 Demo credentials (README + login hint)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@apexflow.dev` | `Admin123!` |
| Manager | `manager@apexflow.dev` | `Manager123!` |
| Developer | `dev@apexflow.dev` | `Dev12345!` |

**Канон:** эти три пользователя **обязаны** быть в seed mock-db с precomputed `passwordHash`.

Seed admin id: `usr_admin` — **cannot be blocked or demoted** via UI/API.

---

## A.5 Seed users (mock-db)

```ts
const SEED_USERS: User[] = [
  {
    id: 'usr_admin',
    email: 'admin@apexflow.dev',
    displayName: 'Alex Admin',
    role: 'admin',
    avatarUrl: undefined,
    isBlocked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    passwordHash: '<hash of Admin123!>',
  },
  {
    id: 'usr_manager',
    email: 'manager@apexflow.dev',
    displayName: 'Mia Manager',
    role: 'manager',
    isBlocked: false,
    createdAt: '2026-01-02T00:00:00.000Z',
    passwordHash: '<hash of Manager123!>',
  },
  {
    id: 'usr_dev',
    email: 'dev@apexflow.dev',
    displayName: 'Dan Developer',
    role: 'developer',
    isBlocked: false,
    createdAt: '2026-01-03T00:00:00.000Z',
    passwordHash: '<hash of Dev12345!>',
  },
  {
    id: 'usr_dev2',
    email: 'julia@apexflow.dev',
    displayName: 'Julia Frontend',
    role: 'developer',
    isBlocked: false,
    createdAt: '2026-01-04T00:00:00.000Z',
    passwordHash: '<hash of Dev12345!>',
  },
];
```

Generator **must** compute and store real hashes using `hashPassword()` from auth domain — placeholders `<hash ...>` in final code **запрещены**.

---

## A.6 Seed tasks (mock-db) — minimum 15 tasks

Распределение по статусам (ориентир):

| Status | Count |
|--------|-------|
| backlog | 4 |
| in_progress | 4 |
| review | 3 |
| done | 4 |

Примеры задач (titles RU, реализуй все 15+ полностью):

| id | title | assigneeId | priority | status | tags |
|----|-------|------------|----------|--------|------|
| tsk_01 | Настроить CI pipeline | usr_dev | high | in_progress | devops, ci |
| tsk_02 | Дизайн Kanban карточек | usr_dev2 | medium | review | ui, design |
| tsk_03 | Mock API interceptor | usr_dev | high | done | backend, mock |
| tsk_04 | RBAC guards | usr_admin | high | done | auth, security |
| tsk_05 | Burndown chart SVG | usr_manager | medium | in_progress | analytics |
| tsk_06 | Страница регистрации | usr_dev2 | low | backlog | auth |
| tsk_07 | Фильтры доски | usr_dev | medium | backlog | board |
| tsk_08 | Team pagination | usr_admin | high | review | admin |
| tsk_09 | i18n словари | usr_dev2 | low | done | i18n |
| tsk_10 | Theme toggle | usr_dev | low | done | ui |
| tsk_11 | E2E test plan | usr_manager | medium | backlog | qa |
| tsk_12 | Оптимизация DnD | usr_dev | high | in_progress | perf |
| tsk_13 | KPI cards | usr_manager | medium | review | analytics |
| tsk_14 | Password validators | usr_dev2 | medium | in_progress | auth |
| tsk_15 | Demo reset endpoint | usr_admin | low | backlog | admin |

Каждая задача:
- `description` — 1–3 предложения осмысленного текста (не Lorem)
- `changeLog` — минимум 1 entry (created)
- `createdAt` / `updatedAt` — spread over last 14 days for burndown realism
- done tasks: `updatedAt` within last 7 days

---

## A.7 Kanban column definitions

| id | order | titleKey RU via i18n |
|----|-------|----------------------|
| backlog | 0 | board.column.backlog → «Бэклог» |
| in_progress | 1 | board.column.inProgress → «В работе» |
| review | 2 | board.column.review → «На ревью» |
| done | 3 | board.column.done → «Готово» |

---

## A.8 Role / Priority i18n labels

| Key | RU | EN |
|-----|----|----|
| role.admin | Администратор | Admin |
| role.manager | Менеджер | Manager |
| role.developer | Разработчик | Developer |
| priority.high | Высокий | High |
| priority.medium | Средний | Medium |
| priority.low | Низкий | Low |

---

## A.9 Toast keys (i18n)

| Key | Когда |
|-----|-------|
| `toast.saved` | успешное сохранение |
| `toast.deleted` | удаление задачи |
| `toast.userCreated` | новый пользователь |
| `toast.userUpdated` | обновление пользователя |
| `toast.demoReset` | demo reset |
| `toast.error.generic` | общая ошибка |

---

## A.10 Hotkeys (канон)

| Key | Action |
|-----|--------|
| `?` | Toggle help drawer (не в input) |
| `G` | Toggle locale RU/EN (не в input) |
| `T` | Toggle theme dark/light (не в input) |
| `N` | Open new task modal on /board (не в input) |
| `Escape` | Close modal/drawer/help; cancel kanban drag |
| `Space` | Pick up/drop focused kanban card (keyboard DnD) |
| `ArrowLeft` / `ArrowRight` | Move focus between columns (keyboard DnD) |
| `Enter` | Drop card into focused column (keyboard DnD) |

---

## A.11 App naming

| Поле | Значение |
|------|----------|
| Package name | `apex-flow` |
| Title | `ApexFlow` |
| Selector prefix | `afx` |
| Root host | `afx-root` |
| Session storage | `afx_session` |

---

## A.12 resetMockDb()

`POST /api/demo/reset` (admin only) вызывает:

1. Clear sessions map
2. Reload `SEED_USERS` and `SEED_TASKS` from constants
3. Return `{ ok: true }`

Client: reload tasks + toast.
