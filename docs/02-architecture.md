# 02 — Architecture (Angular 22+)

Создай приложение строго по этой архитектуре. Не сваливай chart math, DnD hit-test и auth validators в шаблоны компонентов. Не используй NgRx/Akita — только Signals stores.

---

## 2.1 Стек и bootstrap

1. Создай проект Angular **latest stable ≥ 22**, standalone, SCSS, **с routing**, **без SSR**.
2. Включи **zoneless** (дефолт новых приложений). Не добавляй `zone.js` обратно.
3. Prefix: `afx`.
4. Точка входа: `main.ts` → `bootstrapApplication(AppComponent, appConfig)`.
5. `app.config.ts`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockApiInterceptor])),
  ],
};
```

6. Если используешь Tailwind — добавь официальную интеграцию для Angular/PostCSS полностью. Если SCSS — глобальные CSS variables из документа 01.

---

## 2.2 Дерево каталогов (обязательное)

Минимальный каркас из брифа **обязан** существовать. Доменный слой расширяет его до продакшен-структуры:

```
src/
  index.html
  main.ts
  styles.scss
  app/
    app.component.ts
    app.component.html
    app.component.scss
    app.config.ts
    app.routes.ts                    # КАНОН БРИФА

    models/
      app.types.ts                   # КАНОН БРИФА: User, Task, Role, Column, AnalyticsPoint

    core/
      constants/
        auth.constants.ts
        kanban.constants.ts
        analytics.constants.ts
        ui.constants.ts
        api.constants.ts
      models/
        role.model.ts
        task-status.model.ts
        task-priority.model.ts
        theme.model.ts
        locale.model.ts

    domain/
      auth/
        password.validators.ts
        email.validators.ts
        token.helpers.ts
        token.helpers.spec.ts
      kanban/
        column-order.ts
        dnd.helpers.ts
        dnd.helpers.spec.ts
        task-filters.ts
      analytics/
        chart-builder.ts
        chart-builder.spec.ts
        burndown.ts
        priority-stats.ts
      shared/
        id-factory.ts
        date.helpers.ts

    state/
      auth.store.ts
      task.store.ts
      ui.store.ts

    services/
      auth.service.ts                # КАНОН БРИФА
      task.service.ts                # КАНОН БРИФА
      team.service.ts
      analytics.service.ts
      i18n.service.ts
      hotkeys.service.ts
      clipboard.service.ts

    interceptors/
      mock-api.interceptor.ts        # КАНОН БРИФА
      mock-db.ts                     # in-memory DB (imported by interceptor)

    guards/
      auth.guard.ts
      role.guard.ts
      auth.guard.spec.ts
      role.guard.spec.ts

    pages/
      login/
        login.page.ts
        login.page.html
        login.page.scss
      register/
        register.page.ts
        register.page.html
        register.page.scss

    components/
      shell/
        app-shell.component.ts
        app-shell.component.html
        app-shell.component.scss
        sidebar/
          sidebar.component.ts
          sidebar.component.html
          sidebar.component.scss
        topbar/
          topbar.component.ts
          topbar.component.html
          topbar.component.scss
      kanban/
        kanban.component.ts          # КАНОН БРИФА
        kanban.component.html
        kanban.component.scss
        kanban-column/
          kanban-column.component.ts
          kanban-column.component.html
          kanban-column.component.scss
        task-card/
          task-card.component.ts
          task-card.component.html
          task-card.component.scss
        task-detail/
          task-detail.component.ts
          task-detail.component.html
          task-detail.component.scss
        kanban-filters/
          kanban-filters.component.ts
          kanban-filters.component.html
          kanban-filters.component.scss
      team/
        team.component.ts            # КАНОН БРИФА
        team.component.html
        team.component.scss
        team-member-modal/
          team-member-modal.component.ts
          team-member-modal.component.html
          team-member-modal.component.scss
      analytics/
        analytics.component.ts       # КАНОН БРИФА
        analytics.component.html
        analytics.component.scss
        bar-chart/
          bar-chart.component.ts
          bar-chart.component.html
          bar-chart.component.scss
        burndown-chart/
          burndown-chart.component.ts
          burndown-chart.component.html
          burndown-chart.component.scss
      shared/
        modal/
          modal.component.ts
          modal.component.html
          modal.component.scss
        data-table/
          data-table.component.ts
          data-table.component.html
          data-table.component.scss
        priority-badge/
          priority-badge.component.ts
          priority-badge.component.html
          priority-badge.component.scss
        role-badge/
          role-badge.component.ts
          role-badge.component.html
          role-badge.component.scss
        toast/
          toast.component.ts
          toast.component.html
          toast.component.scss
        empty-state/
          empty-state.component.ts
          empty-state.component.html
          empty-state.component.scss
        loading-spinner/
          loading-spinner.component.ts
          loading-spinner.component.html
          loading-spinner.component.scss

    i18n/
      locale.type.ts
      i18n.keys.ts
      ru.ts
      en.ts
```

Допускается объединить мелкие presentational куски, **но** файлы канона брифа и domain/specs из [08-file-checklist.md](08-file-checklist.md) должны существовать.

---

## 2.3 Слои и зависимости

```
pages/components → services → stores → domain/* (pure)
                      ↓
              interceptors/mock-db
                      ↑
              models / core/constants
```

Правила:
1. `domain/*` — **чистые** функции без Angular DI, без DOM (кроме типов PointerEvent в dnd helpers — только geometry math, не listeners).
2. `mock-db.ts` — единственный mutable in-memory store для REST; mutates только через interceptor handlers или explicit seed/reset.
3. `auth.service.ts` / `task.service.ts` — публичные фасады для UI; HTTP calls + sync signals.
4. Компоненты читают state через `inject(AuthService)` / `inject(TaskService)` / stores; DnD listeners в `KanbanComponent`, commit через `TaskService.updateTaskStatus`.
5. Запрещён circular import store ↔ component.

---

## 2.4 Routing (`app.routes.ts`)

```ts
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'board' },
      {
        path: 'board',
        loadComponent: () =>
          import('./components/kanban/kanban.component').then(m => m.KanbanComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'manager'] satisfies Role[] },
      },
      {
        path: 'team',
        loadComponent: () =>
          import('./components/team/team.component').then(m => m.TeamComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] satisfies Role[] },
      },
    ],
  },
  { path: '**', redirectTo: 'board' },
];
```

**Канон:** `AppShellComponent` — layout wrapper с sidebar/topbar/outlet, не `AppComponent` напрямую для protected routes. `AppComponent` — минимальный host `<router-outlet>`.

---

## 2.5 Signals stores / state surface

### `AuthService` (канон API)

```ts
readonly session: Signal<AuthSession | null>
readonly currentUser: Signal<User | null>
readonly isAuthenticated: ComputedSignal<boolean>
readonly isLoading: Signal<boolean>

login(credentials: LoginCredentials): Observable<AuthSession>
register(payload: RegisterPayload): Observable<AuthSession>
logout(): void
hasRole(role: Role): boolean
hasAnyRole(roles: Role[]): boolean
restoreSession(): void   // from localStorage on init
persistSession(session: AuthSession): void
```

### `TaskService` (канон API)

```ts
readonly tasks: Signal<Task[]>
readonly assigneeFilter: WritableSignal<string | 'all'>
readonly priorityFilter: WritableSignal<TaskPriority | 'all'>
readonly filteredTasks: ComputedSignal<Task[]>
readonly columns: ComputedSignal<KanbanColumn[]>
readonly isLoading: Signal<boolean>

loadTasks(): Observable<Task[]>
createTask(input: CreateTaskInput): Observable<Task>
updateTask(taskId: string, patch: UpdateTaskInput): Observable<Task>
updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task>
deleteTask(taskId: string): Observable<void>
addComment(taskId: string, message: string): Observable<Task>
```

### `UiStore`

```ts
theme: WritableSignal<'dark' | 'light'>
locale: WritableSignal<'ru' | 'en'>
helpOpen: WritableSignal<boolean>
toastMessage: WritableSignal<string | null>
globalLoading: WritableSignal<boolean>
selectedTaskId: WritableSignal<string | null>
teamModalOpen: WritableSignal<'add' | 'edit' | null>
```

---

## 2.6 Mock API pipeline

1. UI вызывает `HttpClient` (`GET/POST/PATCH/DELETE` на `/api/...`).
2. `mockApiInterceptor` перехватывает, добавляет `Authorization: Bearer`, ждёт **800 ms**, маршрутизирует в handler.
3. Handler читает/мутирует `mock-db.ts`, возвращает `HttpResponse` или `HttpErrorResponse`.
4. Service on success обновляет signals; UI реагирует через zoneless CD.

**Endpoints (канон):**

| Method | Path | Auth | Handler |
|--------|------|------|---------|
| POST | `/api/auth/login` | no | validate credentials → session |
| POST | `/api/auth/register` | no | create user → session |
| POST | `/api/auth/logout` | yes | invalidate optional |
| GET | `/api/auth/me` | yes | return current user |
| GET | `/api/tasks` | yes | list tasks |
| POST | `/api/tasks` | yes | create task |
| PATCH | `/api/tasks/:id` | yes | update task |
| DELETE | `/api/tasks/:id` | yes | delete (RBAC check) |
| GET | `/api/users` | yes admin | paginated users |
| POST | `/api/users` | yes admin | create user |
| PATCH | `/api/users/:id` | yes admin | update role/block |
| POST | `/api/demo/reset` | yes admin | reload seed |

---

## 2.7 Guards

```ts
export const authGuard: CanActivateFn = () => { /* redirect /login if !isAuthenticated */ };

export const roleGuard: CanActivateFn = (route) => {
  const allowed = route.data['roles'] as Role[];
  /* redirect /board if !hasAnyRole */
};
```

Functional guards only (`CanActivateFn`). Inject `AuthService` + `Router`.

---

## 2.8 App shell composition

- `AppComponent` — `<router-outlet />` only.
- `AppShellComponent` — grid/flex: sidebar | main (topbar + outlet).
- Auth pages — full viewport, без sidebar.

---

## 2.9 Тестирование

Unit-тесты domain + services + guards + interceptor обязательны (см. 07). Component tests — опционально.

---

## 2.10 Запрещённые зависимости

Не добавляй: `@angular/cdk/drag-drop`, `@angular/material`, `@ngrx/*`, `chart.js`, `d3`, `plotly`, `echarts`, `sortablejs`, `ngx-charts`, `primeng`, `zone.js` (явно).
