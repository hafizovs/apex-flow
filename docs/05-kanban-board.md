# 05 — Kanban Board (TaskService + Custom DnD)

Реализуй Kanban-доску **точно** по этому документу. Drag-and-Drop **только** на чистом DOM API + Signals. **Запрещён** `@angular/cdk/drag-drop`.

Главные файлы: `task.service.ts`, `components/kanban/*`, `domain/kanban/*`.

---

## 5.1 Файлы

| Файл | Назначение |
|------|------------|
| `services/task.service.ts` | КАНОН: tasks signals, CRUD, filters, columns |
| `domain/kanban/dnd.helpers.ts` | hit-test, column from point, drag state math |
| `domain/kanban/task-filters.ts` | pure filter by assignee/priority |
| `domain/kanban/column-order.ts` | COLUMN_DEFINITIONS constant |
| `components/kanban/kanban.component.ts` | КАНОН: board orchestrator + pointer listeners |
| `components/kanban/kanban-column/*` | single column drop zone |
| `components/kanban/task-card/*` | card UI + drag handle |
| `components/kanban/task-detail/*` | drawer/modal detail + changeLog |
| `components/kanban/kanban-filters/*` | assignee/priority selects |

---

## 5.2 TaskService — public API

```ts
@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly tasksSignal = signal<Task[]>([]);
  private readonly loadingSignal = signal(false);
  readonly assigneeFilter = signal<string | 'all'>('all');
  readonly priorityFilter = signal<TaskPriority | 'all'>('all');

  readonly tasks = this.tasksSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();

  readonly filteredTasks = computed(() =>
    applyTaskFilters(this.tasksSignal(), {
      assigneeId: this.assigneeFilter(),
      priority: this.priorityFilter(),
    }),
  );

  readonly columns = computed(() =>
    buildKanbanColumns(this.filteredTasks(), COLUMN_DEFINITIONS),
  );

  loadTasks(): Observable<Task[]> { /* GET /api/tasks */ }
  createTask(input: CreateTaskInput): Observable<Task> { /* POST */ }
  updateTask(taskId: string, patch: UpdateTaskInput): Observable<Task> { /* PATCH */ }
  updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task> { /* PATCH status + changeLog */ }
  deleteTask(taskId: string): Observable<void> { /* DELETE */ }
  addComment(taskId: string, message: string): Observable<Task> { /* PATCH append comment log */ }

  setAssigneeFilter(value: string | 'all'): void;
  setPriorityFilter(value: TaskPriority | 'all'): void;
  resetFilters(): void;
}
```

### loadTasks

Called on `KanbanComponent` init (and after login). On success: `tasksSignal.set(tasks)`.

### createTask

1. Validate title non-empty client-side.
2. POST `/api/tasks` with body; server sets `changeLog` initial entry `field: 'status'`, message `created`.
3. Push/replace in `tasksSignal`.

### updateTaskStatus (DnD commit)

1. PATCH `/api/tasks/:id` `{ status: newStatus }`.
2. Server appends changeLog:
   ```ts
   {
     field: 'status',
     oldValue: oldStatus,
     newValue: newStatus,
     message: `status changed`,
     authorId, authorName, at, id
   }
   ```
3. Optimistic optional — **канон:** wait for response then update signal (simpler consistency with mock delay).

### deleteTask

Confirm dialog (custom modal or `window.confirm` **запрещён** — use `ModalComponent`).

RBAC: developer only if `task.assigneeId === currentUser.id`.

### addComment

PATCH with `{ comment: message }` — server appends changeLog entry `field: 'comment'`.

---

## 5.3 Filtering (`domain/kanban/task-filters.ts`)

```ts
export interface TaskFilterState {
  assigneeId: string | 'all';
  priority: TaskPriority | 'all';
}

export function applyTaskFilters(tasks: Task[], filters: TaskFilterState): Task[] {
  return tasks.filter(task => {
    if (filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    return true;
  });
}
```

`KanbanFiltersComponent` binds to `taskService.assigneeFilter` / `priorityFilter` via signals.

Assignee options: `computed` from unique assignees in `tasks()` + `{ id: 'all', label: t('board.filter.allAssignees') }`.

---

## 5.4 Column builder (`domain/kanban/column-order.ts`)

```ts
export const COLUMN_DEFINITIONS: readonly KanbanColumnDef[] = [
  { id: 'backlog', titleKey: 'board.column.backlog', order: 0 },
  { id: 'in_progress', titleKey: 'board.column.inProgress', order: 1 },
  { id: 'review', titleKey: 'board.column.review', order: 2 },
  { id: 'done', titleKey: 'board.column.done', order: 3 },
];

export function buildKanbanColumns(tasks: Task[], defs: readonly KanbanColumnDef[]): KanbanColumn[];
```

For each def: filter tasks where `task.status === def.id`, sort by `updatedAt` DESC, map to `taskIds`.

---

## 5.5 Custom Drag-and-Drop architecture

### State signals in `KanbanComponent`

```ts
readonly draggingTaskId = signal<string | null>(null);
readonly dragOverColumnId = signal<ColumnId | null>(null);
readonly dragGhostPosition = signal<{ x: number; y: number } | null>(null);
```

### Pointer flow

1. **pointerdown** on `.afx-task-card__handle` (not whole card — avoids accidental drags on click):
   - `draggingTaskId.set(taskId)`
   - capture pointerId on handle
   - set `aria-grabbed="true"`
   - store offset from card top-left

2. **pointermove** (window listener while dragging):
   - update `dragGhostPosition` (fixed position ghost element)
   - hit-test column drop zones via `elementFromPoint` or precomputed `getBoundingClientRect()` map
   - `dragOverColumnId.set(columnId | null)`
   - highlight column with CSS class `afx-kanban-column--drag-over`

3. **pointerup** / **pointercancel**:
   - if `dragOverColumnId` !== null && !== current task status:
     - call `taskService.updateTaskStatus(taskId, dragOverColumnId())`
   - reset all drag signals
   - release pointer capture

### Ghost element

Fixed position div appended to `document.body` or inside component with `position: fixed; pointer-events: none; z-index: 999;` — clones card appearance (title + priority badge).

### Hit-test helper (`domain/kanban/dnd.helpers.ts`)

```ts
export function findColumnIdFromPoint(
  x: number,
  y: number,
  columnElements: Map<ColumnId, HTMLElement>,
): ColumnId | null;

export function canDropTask(task: Task, targetColumn: ColumnId): boolean;
// v1: always true (no WIP limits)
```

Use `document.elementFromPoint(x, y)` then `closest('[data-column-id]')`.

Each column root must have `attr.data-column-id="{{ column.id }}"`.

---

## 5.6 Keyboard fallback (a11y)

When task card focused:
- `Space` — pick up (toggle draggingTaskId)
- `ArrowLeft` / `ArrowRight` — move focus between columns (preview dragOverColumnId)
- `Enter` — drop into focused column (updateTaskStatus)
- `Escape` — cancel drag

Implement in `KanbanComponent` `@HostListener('keydown')` with guard on focused card.

---

## 5.7 KanbanComponent template structure

```html
<div class="afx-kanban">
  <afx-kanban-filters />
  <div class="afx-kanban__board" role="region" [attr.aria-label]="t('board.title')">
    @for (column of taskService.columns(); track column.id) {
      <afx-kanban-column
        [column]="column"
        [tasks]="tasksForColumn(column)"
        [dragOver]="dragOverColumnId() === column.id"
        (taskOpen)="openDetail($event)"
        (dragStart)="onDragStart($event)"
      />
    }
  </div>
  @if (draggingTaskId()) {
    <div class="afx-kanban-ghost" [style.transform]="ghostTransform()">...</div>
  }
  @if (selectedTask()) {
    <afx-task-detail [task]="selectedTask()!" (close)="closeDetail()" />
  }
</div>
```

`tasksForColumn` — computed Map or method filtering `filteredTasks()` by status.

---

## 5.8 TaskCardComponent

Display:
- title (truncate 2 lines)
- priority badge (`afx-priority-badge`)
- assignee avatar initial circle
- tags (max 3 visible + counter)
- drag handle icon

Inputs: `task: Task`, `dragging: boolean`

Outputs: `openDetail`, `dragStart { taskId, event: PointerEvent }`

---

## 5.9 TaskDetailComponent

Drawer from right (width 420px) or centered modal — **канон: right drawer**.

Sections:
- title (editable inline if click edit icon → PATCH)
- description textarea save
- assignee select (users from team service cached list or tasks-derived)
- priority select
- tags editor
- changeLog timeline (newest first): icon by field, authorName, at formatted, message
- comment input + submit → `addComment`
- delete button (RBAC)

Close: X button, Escape, overlay click optional.

---

## 5.10 Create task UI

Button «Новая задача» in kanban header → opens modal:
- title, description, assignee, priority, tags (comma-separated), default status `backlog`
- submit → `createTask`

---

## 5.11 Loading & empty states

- `taskService.isLoading()` → skeleton columns (3 placeholder cards per column)
- Empty column → `afx-empty-state` small variant
- Error load → toast + retry button

---

## 5.12 Mock API task handlers (in interceptor)

### GET `/api/tasks`

Return `{ tasks: mockDb.tasks.map(clone) }`

### POST `/api/tasks`

Body: CreateTaskInput + resolve assigneeName from user id.

### PATCH `/api/tasks/:id`

Merge patch; for each changed field append changeLog entry; update `updatedAt`.

Special: `{ comment: string }` → comment log only.

### DELETE `/api/tasks/:id`

Check RBAC; splice from array; 404 if missing.

---

## 5.13 changeLog entry factory

```ts
export function createChangeLogEntry(params: {
  field: TaskChangeField;
  oldValue: string | null;
  newValue: string | null;
  message: string;
  author: UserPublic;
}): TaskChangeLogEntry;
```

Use `createId('log')` from `domain/shared/id-factory.ts`.

---

## 5.14 Tests (минимум)

`domain/kanban/dnd.helpers.spec.ts`:
- findColumnIdFromPoint returns correct column
- canDropTask true for all transitions v1

`services/task.service.spec.ts`:
- filteredTasks respects assignee + priority
- columns groups by status
- updateTaskStatus calls HTTP PATCH

`domain/kanban/task-filters.spec.ts`:
- filter all / single assignee / priority combo

---

## 5.15 Performance notes

- `@for` track `task.id`
- Do not re-create column DOM on every pointermove — only toggle CSS classes
- Ghost uses transform, not top/left layout thrashing
