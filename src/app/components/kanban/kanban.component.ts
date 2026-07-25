import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { MAX_TASK_TITLE } from '../../core/constants/kanban.constants';
import { canDropTask, findColumnIdFromPoint } from '../../domain/kanban/dnd.helpers';
import type {
  ColumnId,
  CreateTaskInput,
  KanbanColumn,
  Task,
  TaskPriority,
  UserPublic,
} from '../../models/app.types';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';
import { TaskService } from '../../services/task.service';
import { TeamService } from '../../services/team.service';
import { UiStore } from '../../state/ui.store';
import { ModalComponent } from '../shared/modal/modal.component';
import { PriorityBadgeComponent } from '../shared/priority-badge/priority-badge.component';
import { KanbanColumnComponent } from './kanban-column/kanban-column.component';
import { KanbanFiltersComponent } from './kanban-filters/kanban-filters.component';
import { TaskDetailComponent } from './task-detail/task-detail.component';

@Component({
  selector: 'afx-kanban',
  imports: [
    KanbanFiltersComponent,
    KanbanColumnComponent,
    TaskDetailComponent,
    ModalComponent,
    ReactiveFormsModule,
    PriorityBadgeComponent,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanComponent implements OnInit {
  protected readonly taskService = inject(TaskService);
  private readonly team = inject(TeamService);
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiStore);
  private readonly i18n = inject(I18nService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly draggingTaskId = signal<string | null>(null);
  readonly dragOverColumnId = signal<ColumnId | null>(null);
  readonly dragGhostPosition = signal<{ x: number; y: number } | null>(null);
  readonly loadError = signal(false);
  readonly assignees = signal<UserPublic[]>([]);

  private pointerOffset = { x: 0, y: 0 };
  private activePointerId: number | null = null;
  private keyboardMode = false;

  protected readonly selectedTask = computed(() => {
    const id = this.ui.selectedTaskId();
    if (!id) {
      return null;
    }
    return this.taskService.tasks().find((t) => t.id === id) ?? null;
  });

  protected readonly ghostTask = computed(() => {
    const id = this.draggingTaskId();
    if (!id) {
      return null;
    }
    return this.taskService.tasks().find((t) => t.id === id) ?? null;
  });

  protected readonly ghostTransform = computed(() => {
    const pos = this.dragGhostPosition();
    if (!pos) {
      return null;
    }
    return `translate(${pos.x}px, ${pos.y}px)`;
  });

  protected readonly assigneeOptions = computed(() =>
    this.assignees().map((u) => ({ id: u.id, label: u.displayName })),
  );

  protected readonly createForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(MAX_TASK_TITLE)]],
    description: [''],
    assigneeId: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    tags: [''],
  });

  protected readonly newTaskOpen = this.ui.newTaskModalOpen;

  ngOnInit(): void {
    this.reload();
    this.team.getAssigneeOptions().subscribe({
      next: (users) => {
        this.assignees.set(users);
        const current = this.auth.currentUser();
        if (current) {
          this.createForm.patchValue({ assigneeId: current.id });
        }
      },
    });

    fromEvent<PointerEvent>(window, 'pointermove')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => this.onPointerMove(e));
    fromEvent<PointerEvent>(window, 'pointerup')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => this.onPointerUp(e));
    fromEvent<PointerEvent>(window, 'pointercancel')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((e) => this.onPointerUp(e));
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected reload(): void {
    this.loadError.set(false);
    this.taskService.loadTasks().subscribe({
      error: () => {
        this.loadError.set(true);
        this.ui.showToast('toast.error.generic');
      },
    });
  }

  protected tasksForColumn(column: KanbanColumn): Task[] {
    const map = new Map(this.taskService.filteredTasks().map((t) => [t.id, t]));
    return column.taskIds
      .map((id) => map.get(id))
      .filter((t): t is Task => !!t);
  }

  protected openDetail(taskId: string): void {
    this.ui.selectTask(taskId);
  }

  protected closeDetail(): void {
    this.ui.selectTask(null);
  }

  protected openCreate(): void {
    this.ui.openNewTaskModal();
  }

  protected closeCreate(): void {
    this.ui.closeNewTaskModal();
  }

  protected submitCreate(): void {
    this.createForm.markAllAsTouched();
    if (this.createForm.invalid) {
      return;
    }
    const raw = this.createForm.getRawValue();
    const input: CreateTaskInput = {
      title: raw.title.trim(),
      description: raw.description,
      assigneeId: raw.assigneeId,
      priority: raw.priority,
      tags: raw.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      status: 'backlog',
    };
    this.taskService.createTask(input).subscribe({
      next: () => {
        this.ui.showToast('toast.saved');
        this.closeCreate();
        this.createForm.patchValue({
          title: '',
          description: '',
          tags: '',
          priority: 'medium',
        });
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }

  protected onDragStart(payload: { taskId: string; event: PointerEvent }): void {
    const { taskId, event } = payload;
    if (event.button !== 0) {
      return;
    }
    this.keyboardMode = false;
    this.draggingTaskId.set(taskId);
    this.activePointerId = event.pointerId;
    const target = event.currentTarget as HTMLElement | null;
    const card = target?.closest('.afx-task-card') as HTMLElement | null;
    const rect = card?.getBoundingClientRect();
    this.pointerOffset = {
      x: rect ? event.clientX - rect.left : 16,
      y: rect ? event.clientY - rect.top : 16,
    };
    this.dragGhostPosition.set({
      x: event.clientX - this.pointerOffset.x,
      y: event.clientY - this.pointerOffset.y,
    });
    try {
      target?.setPointerCapture?.(event.pointerId);
    } catch {
      /* ignore */
    }
  }

  private onPointerMove(event: PointerEvent): void {
    if (!this.draggingTaskId() || this.keyboardMode) {
      return;
    }
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }
    this.dragGhostPosition.set({
      x: event.clientX - this.pointerOffset.x,
      y: event.clientY - this.pointerOffset.y,
    });
    const columnId = findColumnIdFromPoint(event.clientX, event.clientY);
    this.dragOverColumnId.set(columnId);
  }

  private onPointerUp(event: PointerEvent): void {
    if (!this.draggingTaskId() || this.keyboardMode) {
      return;
    }
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }
    this.commitDrop();
  }

  private commitDrop(): void {
    const taskId = this.draggingTaskId();
    const target = this.dragOverColumnId();
    const task = taskId
      ? this.taskService.tasks().find((t) => t.id === taskId)
      : null;
    if (task && target && target !== task.status && canDropTask(task, target)) {
      this.taskService.updateTaskStatus(task.id, target).subscribe({
        error: () => this.ui.showToast('toast.error.generic'),
      });
    }
    this.resetDrag();
  }

  private resetDrag(): void {
    this.draggingTaskId.set(null);
    this.dragOverColumnId.set(null);
    this.dragGhostPosition.set(null);
    this.activePointerId = null;
    this.keyboardMode = false;
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const card = target?.closest('[data-task-id]') as HTMLElement | null;
    const taskId = card?.getAttribute('data-task-id');

    if (event.key === 'Escape' && this.draggingTaskId()) {
      event.preventDefault();
      this.resetDrag();
      return;
    }

    if (!taskId && !this.draggingTaskId()) {
      return;
    }

    if (event.key === ' ' || event.code === 'Space') {
      if (!taskId && !this.draggingTaskId()) {
        return;
      }
      event.preventDefault();
      if (this.draggingTaskId()) {
        this.commitDrop();
      } else if (taskId) {
        this.keyboardMode = true;
        this.draggingTaskId.set(taskId);
        const task = this.taskService.tasks().find((t) => t.id === taskId);
        this.dragOverColumnId.set(task?.status ?? null);
        this.dragGhostPosition.set({ x: 24, y: 96 });
      }
      return;
    }

    if (!this.draggingTaskId()) {
      return;
    }

    const columns = this.taskService.columns();
    const current = this.dragOverColumnId() ?? columns[0]?.id ?? null;
    const idx = columns.findIndex((c) => c.id === current);

    if (event.key === 'ArrowLeft' && idx > 0) {
      event.preventDefault();
      this.dragOverColumnId.set(columns[idx - 1]!.id);
    }
    if (event.key === 'ArrowRight' && idx < columns.length - 1) {
      event.preventDefault();
      this.dragOverColumnId.set(columns[idx + 1]!.id);
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commitDrop();
    }
  }
}
