# 01 — Product Vision & UX

Документ обязателен к исполнению целиком. Генератор кода не имеет права упрощать сценарии или выкидывать экраны/панели.

---

## 1.1 Продукт

| Поле | Значение |
|------|----------|
| Название | **ApexFlow** |
| Подзаголовок (RU) | Система управления проектами и аналитики |
| Подзаголовок (EN) | Project Management & Analytics Platform |
| Тип | Multi-route SPA, Enterprise PM tool |
| Платформа | Современный desktop Chrome/Firefox/Edge; tablet — usable; mobile — auth + read-only board |
| Backend (v1) | Mock REST via HTTP Interceptor (in-memory DB) |
| Auth | JWT-like Bearer token + RBAC (Admin, Manager, Developer) |

**Ценность:** дать команде единое место для управления задачами (Kanban), контроля доступа (RBAC), администрирования пользователей и визуальной аналитики прогресса — всё на современном Angular 22+ Signals без legacy-паттернов.

**Аудитория:** product/engineering команды, tech leads, студенты enterprise Angular, инженеры, которым нужен нетривиальный stateful demo с auth, custom DnD и SVG analytics.

---

## 1.2 Информационная архитектура экранов

Multi-route SPA с **App Shell** (sidebar + topbar + `<router-outlet>`).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Topbar: ApexFlow | search (board) | theme | lang | user menu | logout        │
├──────────────┬───────────────────────────────────────────────────────────────┤
│              │                                                               │
│  SIDEBAR     │   ROUTER OUTLET (lazy feature pages)                          │
│  • Board     │                                                               │
│  • Analytics │   /login, /register — full-page auth (no shell)             │
│  • Team*     │   /board — Kanban                                             │
│              │   /analytics — SVG dashboard                                  │
│              │   /team — user admin table                                    │
│              │                                                               │
└──────────────┴───────────────────────────────────────────────────────────────┘
│ Status/footer (optional): network mock indicator | role badge | version      │
```

`*` Team — виден только `admin`. Analytics — виден `admin` и `manager`.

### Public routes (без shell)
- `/login` — форма входа
- `/register` — форма регистрации (роль по умолчанию `developer`, если не указано иное в seed policy)

### Protected routes (с shell + `authGuard`)
| Route | Компонент | RBAC |
|-------|-----------|------|
| `/board` | Kanban | all authenticated |
| `/analytics` | Analytics | `admin`, `manager` |
| `/team` | Team | `admin` |

Default redirect: `/` → `/board` (если auth) или `/login`.

---

## 1.3 Визуальный язык — Cyberpunk Minimal SaaS

Тема по умолчанию: **dark** (Linear / Asana premium vibe + subtle cyberpunk neon). Светлая тема — переключатель для shell/panels; Kanban cards адаптируются к теме.

CSS variables (обязательные имена в `styles.scss` или `@theme` / `:root` при Tailwind):

```scss
:root,
[data-theme='dark'] {
  --afx-bg-deep: #0a0a0f;
  --afx-bg-panel: #12121a;
  --afx-bg-panel-elevated: #1a1a26;
  --afx-bg-glass: rgba(26, 26, 38, 0.72);
  --afx-border: #2a2a3a;
  --afx-border-strong: #3d3d52;
  --afx-text: #e8e8f0;
  --afx-text-muted: #8888a0;
  --afx-accent: #00e5ff;           /* neon cyan */
  --afx-accent-2: #ff2d95;         /* neon magenta */
  --afx-accent-soft: rgba(0, 229, 255, 0.12);
  --afx-success: #00ff88;
  --afx-warning: #ffb020;
  --afx-danger: #ff4466;
  --afx-priority-high: #ff4466;
  --afx-priority-medium: #ffb020;
  --afx-priority-low: #00e5ff;
  --afx-role-admin: #ff2d95;
  --afx-role-manager: #00e5ff;
  --afx-role-developer: #8888a0;
  --afx-focus-ring: #00e5ff;
  --afx-grid-noise: rgba(255, 255, 255, 0.02);
  --afx-sidebar-width: 240px;
  --afx-topbar-height: 56px;
  --afx-modal-z: 1000;
  --afx-column-backlog: #3d3d52;
  --afx-column-progress: #0066cc;
  --afx-column-review: #9966ff;
  --afx-column-done: #00ff88;
}

[data-theme='light'] {
  --afx-bg-deep: #f4f4f8;
  --afx-bg-panel: #ffffff;
  --afx-bg-panel-elevated: #f0f0f5;
  --afx-bg-glass: rgba(255, 255, 255, 0.85);
  --afx-border: #d8d8e4;
  --afx-border-strong: #b8b8c8;
  --afx-text: #12121a;
  --afx-text-muted: #6a6a80;
  /* accent colors сохраняются для badges/charts */
}
```

**Шрифты (подключи в `index.html`):**
- UI: **Satoshi**, **General Sans** или **DM Sans** — не Inter/Roboto/Arial.
- Mono (changeLog, IDs): **JetBrains Mono** или **IBM Plex Mono**.

**Motion (минимум 3):**
1. Kanban card drag: lift shadow + scale 1.02, 150ms ease-out.
2. Modal open/close: backdrop fade + panel slide-up 200ms.
3. Sidebar nav active indicator: animated underline/glow 180ms.
4. Toast: fade-in 200ms, auto-dismiss из Appendix A.

**Запреты визуала:** purple-on-white «AI slop», emoji в UI, multi-layer drop shadows, Material Design default theme без кастомизации, rounded-full pill-кластеры KPI без смысла.

---

## 1.4 User journeys (обязательные сценарии)

### J1 — Login & persist session
1. Пользователь открывает `/login`.
2. Вводит demo credentials из Appendix A (`admin@apexflow.dev` / `Admin123!`).
3. После успеха — redirect на `/board`; сессия в `localStorage`; refresh страницы сохраняет auth.

### J2 — Kanban DnD & changeLog
1. На `/board` видит 4 колонки с seed-задачами.
2. Перетаскивает карточку из «Бэклог» в «В работе» — status обновляется, changeLog получает запись.
3. Открывает detail drawer/modal — видит историю изменений.

### J3 — Filters on the fly
1. Выбирает фильтр «Исполнитель» → список карточек в колонках мгновенно фильтруется через `computed`.
2. Добавляет фильтр «Приоритет High» — пересечение фильтров.
3. Сброс фильтров возвращает полный board.

### J4 — Admin team management
1. Admin логинится, видит пункт «Команда» в sidebar.
2. На `/team`: поиск по email, pagination, смена роли через select, block user.
3. «Добавить участника» → modal → новый user появляется в таблице и доступен как assignee на board.

### J5 — Analytics live update
1. Manager открывает `/analytics`.
2. Видит Bar chart (priorities) и Burndown (7 days).
3. Перетаскивает задачу в «Готово» на `/board` → возвращается на analytics — burndown пересчитан через signals.

---

## 1.5 RBAC visibility

| UI element | admin | manager | developer |
|------------|-------|---------|-----------|
| Sidebar: Board | ✓ | ✓ | ✓ |
| Sidebar: Analytics | ✓ | ✓ | ✗ |
| Sidebar: Team | ✓ | ✗ | ✗ |
| Create task | ✓ | ✓ | ✓ |
| Delete task | ✓ | ✓ | own only* |
| Team CRUD | ✓ | ✗ | ✗ |
| Demo reset | ✓ | ✗ | ✗ |

`*` **Канон v1:** developer может удалять только задачи, где `assigneeId === currentUser.id`. Admin/manager — любые.

---

## 1.6 Hotkeys

См. [appendix-a-defaults.md](appendix-a-defaults.md) §A.10. Реализуй все строки таблицы. Игнорируй, если `event.target` — `textarea` / `input` / `contenteditable` / `select`, **кроме** Escape (закрыть modal/drawer/help) и оговорённых исключений.

---

## 1.7 Accessibility

1. Sidebar nav — `<nav aria-label>`, active route `aria-current="page"`.
2. Kanban columns — `role="list"`, cards — `role="listitem"`, drag handle `aria-grabbed`.
3. Modals — focus trap, `role="dialog"`, `aria-modal="true"`, return focus on close.
4. Data table — `<table>` с `<th scope="col">`, sort buttons с `aria-sort`.
5. SVG charts — `role="img"` + `aria-label` через i18n; data table fallback summary under chart.
6. Toast — `role="status"`, `aria-live="polite"`.
7. Контраст текста на панелях ≥ WCAG AA.

---

## 1.8 Нефункциональные требования

1. Mock API delay 800 ms — показывай loading indicator (topbar spinner или skeleton), не блокируй UI полностью.
2. Kanban DnD — плавный pointer tracking без заметных лагов для ≤100 задач.
3. Analytics charts — пересчёт через `computed`, синхронный render SVG.
4. Router lazy loading — каждый feature chunk отдельно.
5. Без SSR, без NgRx, без CDK/Material/Chart.js/D3.
6. README с install/start/test, demo credentials, hotkeys.
