# ApexFlow — Главный промпт генерации проекта

> **Как использовать этот пакет:** вставь содержимое этого файла (INDEX.md) в начало диалога с кодовым агентом, затем укажи: «Прочитай и строго выполни документы `docs/01` → `docs/09` и оба appendix в указанном порядке. Генерируй полный код приложения без сокращений.»

---

## 0. Роль и миссия

Ты — **Senior Angular Architect**. Твоя задача — **с нуля** создать полноценное, расширенное, Enterprise-ready веб-приложение:

**«ApexFlow: Система управления проектами и аналитики»**

на **последнем стабильном Angular (22+ на момент генерации)**.

Не спрашивай разрешения «начать с MVP». Выдай **полный рабочий проект**: все файлы, полную Auth/RBAC-систему с functional guards и mock REST через HTTP Interceptor, интерактивную Kanban-доску с кастомным Drag-and-Drop на чистом DOM API, админ-панель команды с пагинацией и модалками, дашборд аналитики с SVG-графиками (Bar + Burndown), i18n, тесты из пакета документов. Выжми максимум из контекста. Не жалей токенов. Пиши шедевр.

Этот INDEX — точка входа. Детальные требования — в связанных документах ниже. При конфликте: **более специфичный документ побеждает**; жёсткие правила из §1 этого файла **неотменяемы**.

---

## 1. ЖЁСТКИЕ ПРАВИЛА ГЕНЕРАЦИИ КОДА (БЕЗ ИСКЛЮЧЕНИЙ)

1. **ПИШИ КОД ПОЛНОСТЬЮ.** Любые сокращения, комментарии вида `// ...`, `// TODO`, `// аналогично`, `// логика аналогична`, `/* rest of file */`, `...existing code...` **КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ**. Напиши каждую строчку, каждый интерфейс, каждую валидацию форм и каждый mock-запрос от начала до конца. Если файлы получаются гигантскими — пиши их целиком, не жалей токены.
2. **Только современный Angular:**
   - Standalone-компоненты (`standalone: true` явно, если CLI ещё требует).
   - **Angular Signals** для абсолютно всего реактивного состояния (`signal`, `computed`, `effect`, `linkedSignal`). **Запрещены** `BehaviorSubject` / `Subject` для UI/auth/task state.
   - Новый Control Flow: `@if`, `@for` (с обязательным `track`), `@switch`, `@let`. **Запрещены** `*ngIf`, `*ngFor`, `*ngSwitch`.
   - `input()`, `output()`, `model()` вместо `@Input` / `@Output` декораторов.
   - `inject()` для DI.
   - **Zoneless** change detection (как в новых приложениях Angular 21+/22+). Не опирайся на Zone.js для обновления UI.
   - `ChangeDetectionStrategy.OnPush` (дефолт новых приложений — не отключай).
   - **Router** с lazy loading через `loadComponent` для всех feature-страниц.
3. **Разделяй логику:** интерфейсы/модели отдельно, чистая доменная логика (validators, DnD hit-test, chart builders) в `domain/`, Angular-сервисы-обёртки отдельно, UI-компоненты отдельно, stores (signals) отдельно. UI **не** считает SVG path/coordinates в шаблоне вручную и **не** мутирует mock DB напрямую.
4. **Kanban Drag-and-Drop — чистый DOM API + Signals.** **Запрещены** `@angular/cdk/drag-drop`, SortableJS, interact.js и любые DnD-библиотеки.
5. **Графики аналитики — чистый SVG.** **Запрещены** Chart.js, D3, Plotly, ECharts, ngx-charts как npm-зависимости (chart builders пишешь сам в `domain/analytics/`).
6. **Mock backend обязателен:** `mock-api.interceptor.ts` симулирует полноценный REST с in-memory DB, задержкой сети **800 ms** и Bearer-токеном.
7. **Запрещены заглушки:** пустые методы, `return []`, fake users, Lorem Ipsum в UI, `console.log` вместо логики, «потом допишем».
8. **Тесты обязательны** минимум для: auth service, task service, role guard, mock interceptor, chart builder, DnD rules — см. [07-features-extended.md](07-features-extended.md), [09-acceptance-criteria.md](09-acceptance-criteria.md).
9. **i18n RU/EN** через signal-словарь (не `@angular/localize` build-time), см. [07-features-extended.md](07-features-extended.md).
10. **Структура файлов** должна соответствовать [08-file-checklist.md](08-file-checklist.md). Не пропускай файлы из чеклиста. Минимальный каркас из брифа **обязан** присутствовать (rename-locked):
    - `src/app/models/app.types.ts`
    - `src/app/services/auth.service.ts`
    - `src/app/services/task.service.ts`
    - `src/app/interceptors/mock-api.interceptor.ts`
    - `src/app/components/kanban/kanban.component.ts`
    - `src/app/components/analytics/analytics.component.ts`
    - `src/app/components/team/team.component.ts`
    - `src/app/app.routes.ts`
    Дополнительные файлы из чеклиста (`domain/`, `state/`, `guards/`, `pages/`, `i18n/`, specs, shell, shared) — тоже обязательны.
11. **Стили:** тема **Cyberpunk Minimal SaaS** (Linear / Asana / ClickUp vibe). Допустимы **Tailwind CSS** *или* чистый SCSS + CSS variables. Если выбираешь Tailwind — настрой его полностью (конфиг, content paths, утилиты) без TODO. Если SCSS — используй CSS variables `--afx-*` из [01-product-vision.md](01-product-vision.md). Не смешивай хаотично оба подхода в одном компоненте.
12. **Интерфейс** оформляй как современный дорогой SaaS-продукт: чистая тёмная/светлая тема, sidebar shell, glass panels, neon accents, Kanban board, admin tables, SVG analytics.

---

## 2. Порядок чтения и выполнения документов

Выполняй **строго по порядку**. Не начинай UI, пока не зафиксированы модели, auth pipeline и mock API.

| Шаг | Документ | Что сделать |
|-----|----------|-------------|
| 1 | [01-product-vision.md](01-product-vision.md) | Понять продукт, multi-route UX, journeys, хоткеи, a11y, визуальный язык |
| 2 | [02-architecture.md](02-architecture.md) | Создать скелет Angular-проекта, routing, папки |
| 3 | [03-data-model.md](03-data-model.md) + [appendix-a-defaults.md](appendix-a-defaults.md) | User, Task, Role, Column, AnalyticsPoint, AuthSession |
| 4 | [04-auth-rbac.md](04-auth-rbac.md) + [appendix-b-formulas.md](appendix-b-formulas.md) §B.7–B.9 | AuthService, guards, interceptor, login/register |
| 5 | [05-kanban-board.md](05-kanban-board.md) | TaskService, custom DnD, filters, changeLog |
| 6 | [06-ui-panels.md](06-ui-panels.md) | App shell, team table/modals, analytics layout, auth pages |
| 7 | [07-features-extended.md](07-features-extended.md) | i18n, hotkeys, theme, demo reset, тесты |
| 8 | [08-file-checklist.md](08-file-checklist.md) | Сверка: все файлы существуют и полны |
| 9 | [09-acceptance-criteria.md](09-acceptance-criteria.md) | Прогнать DoD / приёмку |

---

## 3. Краткий функциональный объём (обязателен целиком)

### 1. Auth & RBAC (lazy routes `/login`, `/register`)
- Страницы Login и Register с кастомной валидацией форм.
- Mock Auth-сервис на Signals: текущая сессия, токен, роль (`admin` | `manager` | `developer`).
- Functional Router Guards: `authGuard`, `roleGuard` — защита роутов по роли.
- HTTP Interceptor: Bearer token + симуляция задержки сети **800 ms** + in-memory REST.

### 2. Kanban Task Board (`/board`)
- Колонки: Бэклог, В работе, На ревью, Готово.
- Кастомный Drag-and-Drop на чистом DOM API + Signals (без CDK).
- Задача: ID, название, описание, исполнитель, приоритет (High/Medium/Low), теги, лог изменений.
- Фильтрация по исполнителю и приоритету «на лету» через `computed`-сигналы.

### 3. Team Management (`/team`, Admin only)
- Таблица пользователей: пагинация, поиск, фильтрация.
- Админ меняет роли, блокирует, добавляет членов команды через кастомные modals.

### 4. Analytics Dashboard (`/analytics`, Admin + Manager)
- SVG Bar Chart: распределение задач по приоритетам.
- SVG Line Chart: burndown за последние 7 дней.
- Графики адаптивные, перерисовываются при изменении задач.

### Расширения (обязательны)
- Hotkeys, theme toggle, i18n RU/EN, demo reset (Admin), unit-тесты auth/task/guard/interceptor/charts/dnd.

---

## 4. Технологический стек (зафиксировано)

| Область | Выбор |
|---------|--------|
| Framework | Angular **latest stable ≥ 22** |
| Components | Standalone only |
| Routing | `@angular/router`, lazy `loadComponent` |
| State | Signals stores + services (`providedIn: 'root'`) |
| CD | Zoneless + OnPush |
| HTTP | `HttpClient` + functional interceptor |
| Kanban DnD | Pure DOM Pointer Events + Signals |
| Charts | Pure SVG |
| Forms | Reactive forms + signal-driven validation display |
| Styling | Tailwind CSS **или** SCSS + CSS variables (Cyberpunk Minimal SaaS) |
| i18n | Signal-словари `ru.ts` / `en.ts` + `I18nService.t(key)` |
| Tests | Стандартный test runner CLI проекта (Vitest или Jest) |
| Package manager | npm |
| Language UI default | `ru` |
| Selector prefix | `afx` |

**Команда старта проекта (ориентир):**

```bash
npx @angular/cli@latest new apex-flow --routing --style=scss --ssr=false
cd apex-flow
```

Имя приложения в `package.json` / title: **ApexFlow**. Селектор префикс: `afx`.

---

## 5. Definition of Done (кратко)

Приложение **готово**, только если:

1. `ng serve` / `npm start` запускает приложение без ошибок.
2. Login/Register работают; сессия persist в `localStorage`; logout очищает сессию.
3. `authGuard` редиректит неавторизованных на `/login`; `roleGuard` блокирует `/team` для non-admin и `/analytics` для developer.
4. Interceptor добавляет Bearer и задержку 800 ms; mock CRUD для users/tasks работает.
5. Kanban: 4 колонки, DnD между ними, фильтры assignee/priority, changeLog при смене status.
6. Team: таблица с pagination/search; admin меняет role, block/unblock, add member через modal.
7. Analytics: SVG bar (priorities) + line burndown (7 days) обновляются при изменении tasks.
8. i18n RU↔EN, theme toggle, hotkeys — работают.
9. Unit-тесты auth / task / guard / interceptor / chart-builder / dnd проходят.
10. В исходниках **нет** `// TODO`, `// ...`, `*ngIf`, `*ngFor`, BehaviorSubject-state, CDK DragDrop, Chart.js, D3, NgRx.
11. Чеклист [08-file-checklist.md](08-file-checklist.md) выполнен на 100%.
12. Все пункты [09-acceptance-criteria.md](09-acceptance-criteria.md) отмечены как выполненные.

Полный текст приёмки — в документе 09.

---

## 6. Стиль ответа генератора

1. Сначала создай структуру проекта и доменный слой (модели → validators → chart/dnd pure → stores → services → interceptor/guards).
2. Затем UI (shell → auth pages → kanban → team → analytics), затем i18n и тесты.
3. Каждый файл выводи **целиком** с путём.
4. После завершения — кратко перечисли, как запустить и как проверить ключевые сценарии из §5.
5. Не предлагай «упростить DnD до select dropdown». Не заменяй SVG charts на `<canvas>` или Chart.js. Не пропускай RBAC guards или mock interceptor.

---

## 7. Начни сейчас

Прочитай [01-product-vision.md](01-product-vision.md) и приступай к генерации полного проекта **ApexFlow** согласно всему пакету `docs/`.

**Начинай генерацию. Напиши этот проект как Senior Angular Architect.**
