# 07 — Extended Features

Все фичи этого документа **обязательны**. Не помечай их optional в коде.

---

## 7.1 i18n (signal-словари)

### Файлы
- `i18n/locale.type.ts` — `LocaleId = 'ru' | 'en'`
- `i18n/i18n.keys.ts` — union всех ключей **или** const object `I18N_KEYS`
- `i18n/ru.ts` / `i18n/en.ts` — полные словари (зеркальные ключи)
- `services/i18n.service.ts` — `locale = signal`, `t(key, params?)`

### I18nService API

```ts
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly locale = signal<LocaleId>(DEFAULT_LOCALE);

  t(key: I18nKey, params?: Record<string, string | number>): string;
  toggleLocale(): void;
  setLocale(id: LocaleId): void;
}
```

` t()` lookup in `ru` or `en` map; missing key returns key string (dev warning optional).

Param interpolation: `"Hello, {name}"` → replace `{name}`.

### Требования
1. Default locale: `ru`.
2. **Все** visible strings UI через `t()` — включая aria-label, placeholders, validation messages.
3. Переключение `G` мгновенно обновляет UI (signal-driven templates).
4. Persist locale in `localStorage` key `afx_locale` optional — **канон:** persist preferred.

### Minimum key groups
`nav.*`, `auth.*`, `board.*`, `team.*`, `analytics.*`, `role.*`, `priority.*`, `status.*`, `error.*`, `toast.*`, `help.*`, `theme.*`, `common.*`

---

## 7.2 Theme toggle

- `uiStore.theme: WritableSignal<'dark' | 'light'>`
- Persist `localStorage` key `afx_theme`
- On toggle: `document.documentElement.setAttribute('data-theme', theme)`
- Initial load: read storage or `DEFAULT_THEME` from Appendix A

Hotkey `T` (outside inputs) toggles theme.

---

## 7.3 Hotkeys

`HotkeysService` listens `window:keydown` (DestroyRef cleanup).

| Key | Context | Action |
|-----|---------|--------|
| `?` | global (outside inputs) | toggle help drawer |
| `G` | global | toggle locale RU/EN |
| `T` | global | toggle theme |
| `Escape` | global | close modal/drawer/help; cancel kanban drag |
| `N` | on /board (outside inputs) | open new task modal |
| `Ctrl/Cmd+K` | global | focus board search if exists (optional focus topbar) |

Full table duplicated in Appendix A §A.10.

Ignore when target is input/textarea/select/contenteditable **except** Escape.

---

## 7.4 Demo reset (Admin)

Topbar user menu or team page footer: «Сбросить demo данные» (admin only).

Calls `POST /api/demo/reset` → reloads mock-db seed → `taskService.loadTasks()` + toast `toast.demoReset`.

Confirm via ModalComponent before reset.

---

## 7.5 Global loading indicator

`uiStore.globalLoading` set true during any HTTP call optional — **канон:** AuthService/TaskService/TeamService set loading flags; Topbar shows spinner when any true OR dedicated `HttpPendingInterceptor` counts requests.

Simplest: each service manages own `isLoading` + topbar ORs them via computed in shell.

---

## 7.6 TeamService

```ts
@Injectable({ providedIn: 'root' })
export class TeamService {
  loadUsers(query: TeamQuery): Observable<PaginatedResult<UserPublic>>;
  createUser(input: CreateUserInput): Observable<UserPublic>;
  updateUser(id: string, patch: UpdateUserInput): Observable<UserPublic>;
  getAssigneeOptions(): Observable<UserPublic[]>; // for kanban selects — GET /api/users simplified or extract from tasks
}
```

For kanban assignee dropdown: **канон:** `GET /api/users/assignees` returning non-blocked users OR reuse cached list from first team load — implement `GET /api/users/assignees` in mock (all authenticated roles can read assignee list).

---

## 7.7 AnalyticsService (thin facade)

Optional wrapper:

```ts
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly tasks = inject(TaskService);

  readonly summary = computed(() => buildAnalyticsSummary(this.tasks.tasks()));
}
```

Logic stays in `domain/analytics/*` pure functions.

---

## 7.8 Clipboard (optional minor)

If copy task ID or share link — `ClipboardService` like SQL-Forge. **Not blocking DoD** unless implemented in UI.

---

## 7.9 Unit tests (обязательные)

Создай и добейся зелёного прогона:

| Файл | Что покрыть |
|------|-------------|
| `domain/analytics/chart-builder.spec.ts` | priority counts; bar rects dimensions; burndown 7 points length |
| `domain/analytics/burndown.spec.ts` | remainingTasks decreases when tasks marked done |
| `domain/kanban/dnd.helpers.spec.ts` | column hit-test; canDrop |
| `domain/kanban/task-filters.spec.ts` | assignee + priority filters |
| `domain/auth/token.helpers.spec.ts` | generate/parse token roundtrip |
| `services/auth.service.spec.ts` | login/logout/persist/hasRole/restoreSession |
| `services/task.service.spec.ts` | filteredTasks; columns; CRUD mocks |
| `interceptors/mock-api.interceptor.spec.ts` | 800ms delay; 401 without token; login success |
| `guards/auth.guard.spec.ts` | redirect when logged out |
| `guards/role.guard.spec.ts` | admin vs developer on /team route data |

Use `HttpClientTestingModule` + `provideHttpClient(withInterceptors([mockApiInterceptor]))` where needed.

---

## 7.10 README проекта

В корне приложения `README.md`:
- Описание ApexFlow
- `npm install` / `npm start` / `npm test`
- Demo credentials (Appendix A)
- Routes overview + RBAC matrix
- Hotkeys summary
- Ссылка на пакет промпта `../docs` (относительно app folder в монорепо `apex_flow/`)

---

## 7.11 Quality gates

Перед завершением генерации:
1. Нет `TODO` / `...` / `as any` без нужды.
2. Нет `*ngIf` / `*ngFor` / `BehaviorSubject` для state.
3. Нет `@angular/cdk/drag-drop` / `@angular/material` / Chart.js / D3 / NgRx.
4. Все файлы из [08-file-checklist.md](08-file-checklist.md) существуют.
5. Сценарии [09-acceptance-criteria.md](09-acceptance-criteria.md) выполнимы вручную.
6. Kanban DnD работает без CDK; charts — pure SVG.
7. Mock interceptor delay = 800ms on all `/api/*`.
