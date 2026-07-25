# 03 — Data Model & Types

Все интерфейсы ниже реализуй **буквально** в `src/app/models/app.types.ts`. Числовые дефолты и seed — в [appendix-a-defaults.md](appendix-a-defaults.md); скопируй значения в `core/constants/*` без «примерно».

---

## 3.1 Единицы и понятия

| Величина | Единица | Пояснение |
|----------|---------|-----------|
| User/Task id | string | префиксы `usr_`, `tsk_`, `log_` |
| Timestamps | ISO 8601 string | `createdAt`, `updatedAt`, `at` in changeLog |
| Token | string | mock JWT-like opaque string |
| Pagination | 1-based page | `page`, `pageSize`, `total` |
| Chart dates | `YYYY-MM-DD` | local midnight buckets for burndown |

---

## 3.2 Идентификаторы и enum/union типы

```ts
export type Role = 'admin' | 'manager' | 'developer';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus =
  | 'backlog'
  | 'in_progress'
  | 'review'
  | 'done';

/** Alias for Kanban column id — 1:1 with TaskStatus in v1 */
export type ColumnId = TaskStatus;

export type ThemeId = 'dark' | 'light';

export type LocaleId = 'ru' | 'en';

export type TaskChangeField =
  | 'status'
  | 'title'
  | 'description'
  | 'assigneeId'
  | 'priority'
  | 'tags'
  | 'comment';

export type SortDirection = 'asc' | 'desc';

export type TeamModalMode = 'add' | 'edit' | null;
```

---

## 3.3 User

```ts
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
  /** Never expose in API responses to non-admin; stored hashed in mock-db only */
  passwordHash?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  displayName?: string;
  role?: Role;
  isBlocked?: boolean;
}
```

**Инварианты:**
- `email` unique case-insensitive.
- `isBlocked === true` → login returns 403.
- Register создаёт `role: 'developer'` unless admin creates via team API.
- Admin user из seed не может быть удалён или заблокирован через UI (guard в handler).

---

## 3.4 Auth

```ts
export interface AuthSession {
  token: string;
  user: UserPublic;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface StoredSession {
  token: string;
  user: UserPublic;
  expiresAt: string;
}
```

**localStorage key:** `afx_session` (константа `SESSION_STORAGE_KEY`).

---

## 3.5 Task & ChangeLog

```ts
export interface TaskChangeLogEntry {
  id: string;
  at: string;
  authorId: string;
  authorName: string;
  field: TaskChangeField;
  oldValue: string | null;
  newValue: string | null;
  message: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  changeLog: TaskChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  tags: string[];
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  tags?: string[];
  status?: TaskStatus;
}
```

**Инварианты:**
- `title` trim, min 1, max 120 chars.
- `description` max 4000 chars.
- `tags` max 8 tags, each max 24 chars, lowercase normalized.
- При любом patch — append `changeLog` entry(ies) с diff по изменённым полям.
- `addComment` → entry с `field: 'comment'`, `message` = comment text.
- DnD status change → entry с `field: 'status'`, old/new status labels via i18n keys stored as raw enum values.

---

## 3.6 Kanban Column

```ts
export interface KanbanColumn {
  id: ColumnId;
  titleKey: string;   // i18n key, e.g. 'board.column.backlog'
  order: number;
  taskIds: string[];
}
```

**Канон порядок колонок:**

| id | order | titleKey |
|----|-------|----------|
| `backlog` | 0 | `board.column.backlog` |
| `in_progress` | 1 | `board.column.inProgress` |
| `review` | 2 | `board.column.review` |
| `done` | 3 | `board.column.done` |

`columns` computed: group `filteredTasks()` by `status`, sort taskIds by `updatedAt` DESC.

---

## 3.7 Analytics

```ts
export interface AnalyticsPoint {
  date: string;              // YYYY-MM-DD
  remainingTasks: number;
  completedTasks: number;
  totalScope: number;
}

export interface PriorityStat {
  priority: TaskPriority;
  count: number;
  labelKey: string;
}

export interface AnalyticsSummary {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueEstimate: number;   // v1: tasks in backlog > 7 days (optional heuristic)
  priorityStats: PriorityStat[];
  burndownPoints: AnalyticsPoint[];
}
```

---

## 3.8 Team / Pagination

```ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TeamQuery {
  page: number;
  pageSize: number;
  search: string;
  roleFilter: Role | 'all';
  sortBy: 'email' | 'displayName' | 'createdAt' | 'role';
  sortDirection: SortDirection;
}

export interface TeamMemberDraft {
  email: string;
  displayName: string;
  password: string;
  role: Role;
}
```

---

## 3.9 API envelopes

```ts
export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export interface ApiListResponse<T> {
  data: T;
}

export interface LoginResponse {
  session: AuthSession;
}

export interface TasksResponse {
  tasks: Task[];
}
```

---

## 3.10 i18n enum labels (reference keys)

| Enum | Key pattern |
|------|-------------|
| Role admin | `role.admin` |
| Role manager | `role.manager` |
| Role developer | `role.developer` |
| Priority high | `priority.high` |
| Priority medium | `priority.medium` |
| Priority low | `priority.low` |
| Status backlog | `status.backlog` |
| Column titles | `board.column.*` |

Компоненты **не** хардкодят русские строки для enum badges — только `t(key)`.

---

## 3.11 Relations diagram

```
User 1 ── * Task (assigneeId)
User 1 ── * TaskChangeLogEntry (authorId)
Task 1 ── * TaskChangeLogEntry (embedded array)
TaskStatus = ColumnId (4 fixed columns)
```

---

## 3.12 Export barrel

`app.types.ts` экспортирует все public types. Допускается re-export из `core/models/*.model.ts`, но **файл `models/app.types.ts` обязан существовать** и содержать полный набор интерфейсов §3.3–3.9 (или re-export с комментарием `// canonical aggregate`).
