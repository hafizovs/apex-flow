import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAX_TASK_DESCRIPTION, MAX_TASK_TITLE } from '../../../../../core/constants/kanban.constants';
import { formatDate } from '../../../../../domain/shared/date.helpers';
import type { Task, TaskPriority, UserPublic } from '../../../../../core/models/app.types';
import { AuthService } from '../../../../auth/auth.service';
import { I18nService } from '../../../../../core/i18n.service';
import { TaskService } from '../../../task.service';
import { TeamService } from '../../../../team/team.service';
import { UiStore } from '../../../../../core/ui/ui.store';
import { ModalComponent } from '../../../../../shared/modal/modal.component';
import { PriorityBadgeComponent } from '../../../../../shared/priority-badge/priority-badge.component';

@Component({
  selector: 'afx-task-detail',
  imports: [ReactiveFormsModule, PriorityBadgeComponent, ModalComponent],
  templateUrl: './task-detail.component.html',
  styleUrl: './task-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailComponent implements OnInit {
  readonly task = input.required<Task>();
  readonly close = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly tasks = inject(TaskService);
  private readonly team = inject(TeamService);
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UiStore);
  protected readonly i18n = inject(I18nService);

  protected readonly editing = signal(false);
  protected readonly assignees = signal<UserPublic[]>([]);
  protected readonly comment = signal('');
  protected readonly confirmOpen = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(MAX_TASK_TITLE)]],
    description: ['', [Validators.maxLength(MAX_TASK_DESCRIPTION)]],
    assigneeId: ['', Validators.required],
    priority: ['medium' as TaskPriority, Validators.required],
    tags: [''],
  });

  protected readonly canDelete = computed(() => {
    const user = this.auth.currentUser();
    const task = this.task();
    if (!user) {
      return false;
    }
    if (user.role === 'admin' || user.role === 'manager') {
      return true;
    }
    return task.assigneeId === user.id;
  });

  protected readonly changeLog = computed(() =>
    [...this.task().changeLog].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    ),
  );

  constructor() {
    effect(() => {
      const task = this.task();
      this.form.patchValue({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
        tags: task.tags.join(', '),
      });
    });
  }

  ngOnInit(): void {
    this.team.getAssigneeOptions().subscribe({
      next: (users) => this.assignees.set(users),
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected formatAt(iso: string): string {
    return formatDate(iso, this.i18n.locale() === 'ru' ? 'ru-RU' : 'en-GB', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected toggleEdit(): void {
    this.editing.update((v) => !v);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    this.tasks
      .updateTask(this.task().id, {
        title: raw.title.trim(),
        description: raw.description,
        assigneeId: raw.assigneeId,
        priority: raw.priority,
        tags,
      })
      .subscribe({
        next: () => {
          this.ui.showToast('toast.saved');
          this.editing.set(false);
        },
        error: () => this.ui.showToast('toast.error.generic'),
      });
  }

  protected submitComment(): void {
    const message = this.comment().trim();
    if (!message) {
      return;
    }
    this.tasks.addComment(this.task().id, message).subscribe({
      next: () => {
        this.comment.set('');
        this.ui.showToast('toast.saved');
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }

  protected requestDelete(): void {
    this.confirmOpen.set(true);
  }

  protected cancelDelete(): void {
    this.confirmOpen.set(false);
  }

  protected confirmDelete(): void {
    this.tasks.deleteTask(this.task().id).subscribe({
      next: () => {
        this.ui.showToast('toast.deleted');
        this.confirmOpen.set(false);
        this.close.emit();
      },
      error: () => this.ui.showToast('toast.error.generic'),
    });
  }
}
