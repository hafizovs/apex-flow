# 09 — Acceptance Criteria & Definition of Done

Чеклист приёмки. Генератор после завершения работ **обязан** пройти каждый пункт. Пункт провален → доработать код, не оправдываться.

---

## 9.1 Build & Run

- [ ] `npm install` завершается без ошибок
- [ ] `npm start` / `ng serve` поднимает приложение
- [ ] Консоль браузера без ошибок runtime при старте
- [ ] Нет красных ошибок Angular (NG0xxx) в консоли
- [ ] Zoneless: login, DnD, filters обновляют UI без Zone.js hacks
- [ ] В зависимостях нет `@angular/cdk/drag-drop`, `@angular/material`, `@ngrx/*`, `chart.js`, `d3`, `sortablejs`, `zone.js` (явно)
- [ ] Если Tailwind не подключён — SCSS variables тема работает; если подключён — конфиг полный
- [ ] Lazy routes загружают отдельные chunks (видно в Network при первом переходе)

---

## 9.2 Routing & Shell

- [ ] `/` redirect: authenticated → `/board`, else → `/login`
- [ ] AppShell: sidebar + topbar + outlet на protected routes
- [ ] Login/Register — full page без sidebar
- [ ] Sidebar показывает Board для всех; Analytics для admin/manager; Team для admin only
- [ ] Responsive: sidebar collapses на узком viewport без поломки layout

---

## 9.3 Auth & Session

- [ ] Login с demo admin credentials → redirect `/board`
- [ ] Invalid credentials → inline error, no crash
- [ ] Blocked user login → 403 message
- [ ] Register создаёт developer user → auto session → `/board`
- [ ] Duplicate email register → 409 message
- [ ] Logout очищает `localStorage` key `afx_session` → redirect `/login`
- [ ] Page refresh сохраняет session если not expired
- [ ] Expired session → treated as logged out

---

## 9.4 Guards & RBAC

- [ ] Unauthenticated access `/board` → redirect `/login`
- [ ] Developer access `/team` → redirect `/board`
- [ ] Developer access `/analytics` → redirect `/board`
- [ ] Manager access `/analytics` → allowed
- [ ] Manager access `/team` → redirect `/board`
- [ ] Admin access all protected routes → allowed

---

## 9.5 Mock API Interceptor

- [ ] All `/api/*` requests delayed ~800ms (visible loading indicator)
- [ ] Protected requests include `Authorization: Bearer <token>`
- [ ] Missing token on protected endpoint → 401
- [ ] Developer calling admin users API → 403
- [ ] POST `/api/demo/reset` works for admin only

---

## 9.6 Kanban Board

- [ ] 4 columns: Backlog, In Progress, Review, Done (localized labels)
- [ ] Seed tasks visible on first load (≥12 tasks)
- [ ] Drag card between columns updates status via PATCH
- [ ] changeLog receives entry on status change
- [ ] Task detail drawer shows changeLog timeline
- [ ] Filter by assignee updates visible cards instantly
- [ ] Filter by priority works combined with assignee filter
- [ ] Create task modal adds card to board
- [ ] Delete task respects RBAC (developer own tasks only)
- [ ] addComment appends changeLog entry
- [ ] DnD uses pointer events — **not** CDK drag-drop
- [ ] Keyboard fallback: Space/Arrows/Enter/Escape on focused card

---

## 9.7 Team Management

- [ ] Table lists users with pagination
- [ ] Search by email filters results
- [ ] Role filter works
- [ ] Sort by column toggles asc/desc
- [ ] Admin changes user role via select → PATCH persists
- [ ] Block/unblock toggles `isBlocked` (cannot block seed admin)
- [ ] Add member modal creates user → appears in table
- [ ] Edit member modal updates displayName/role
- [ ] Modals: focus trap, Escape closes, custom (no Material)

---

## 9.8 Analytics Dashboard

- [ ] KPI cards show total, done, in progress, completion %
- [ ] Bar chart SVG: 3 bars for high/medium/low priorities
- [ ] Bar chart updates when tasks change
- [ ] Burndown line chart SVG: 7 data points (last 7 days)
- [ ] Burndown updates when task moved to Done
- [ ] Charts responsive (viewBox + preserveAspectRatio)
- [ ] Charts have aria-label via i18n
- [ ] **No** Chart.js / canvas chart libraries

---

## 9.9 i18n / Theme / Hotkeys

- [ ] Default UI language Russian
- [ ] `G` toggles RU↔EN for all visible strings
- [ ] `T` toggles dark/light theme via `data-theme`
- [ ] `?` opens help drawer with hotkey list
- [ ] `N` on board opens new task modal (outside inputs)
- [ ] Escape closes modals/drawers/cancels drag

---

## 9.10 Tests

- [ ] `npm test` проходит для обязательных specs из документа 07
- [ ] auth.service.spec / task.service.spec / role.guard.spec / mock-api.interceptor.spec / chart-builder.spec / dnd.helpers.spec — зелёные

---

## 9.11 Code quality

- [ ] Нет `// TODO`, `// ...`, `// аналогично`, `// логика аналогична`
- [ ] Нет `*ngIf`, `*ngFor`, `*ngSwitch`
- [ ] Нет BehaviorSubject/Subject для auth/task/UI state
- [ ] Chart math и DnD helpers живут в `domain/`, не в шаблонах
- [ ] Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%
- [ ] Канонические пути брифа существуют под точными именами

---

## 9.12 Финальная декларация

После выполнения всех пунктов генератор кратко сообщает:

1. Как запустить (`npm install`, `npm start`, `npm test`).
2. Demo credentials из Appendix A.
3. Как проверить J1–J5 из документа 01.
4. Что пакет `docs/` считается исполненным.

Приложение **не готово**, пока любой чекбокс §9.1–§9.11 остаётся ложным.
