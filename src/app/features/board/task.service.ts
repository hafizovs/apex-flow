import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, tap } from 'rxjs';
import { API_PATHS } from '../../core/constants/api.constants';
import {
  COLUMN_DEFINITIONS,
  buildKanbanColumns,
} from '../../domain/kanban/column-order';
import { applyTaskFilters } from '../../domain/kanban/task-filters';
import type {
  CreateTaskInput,
  Task,
  TaskPriority,
  TaskStatus,
  TasksResponse,
  UpdateTaskInput,
} from '../../core/models/app.types';
import { AuthService } from '../auth/auth.service';

type TaskPatch = UpdateTaskInput & { comment?: string };

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly tasksSignal = signal<Task[]>([]);
  private readonly loadingSignal = signal(false);

  readonly tasks = this.tasksSignal.asReadonly();
  readonly assigneeFilter = signal<string | 'all'>('all');
  readonly priorityFilter = signal<TaskPriority | 'all'>('all');
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

  loadTasks(): Observable<Task[]> {
    this.loadingSignal.set(true);
    return this.http
      .get<TasksResponse>(API_PATHS.tasks, {
        headers: this.auth.authHeaders(),
      })
      .pipe(
        map((res) => res.tasks),
        tap((tasks) => this.tasksSignal.set(tasks)),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  createTask(input: CreateTaskInput): Observable<Task> {
    return this.http
      .post<Task>(API_PATHS.tasks, input, {
        headers: this.auth.authHeaders(),
      })
      .pipe(
        tap((task) =>
          this.tasksSignal.update((list) => [...list, task]),
        ),
      );
  }

  updateTask(taskId: string, patch: TaskPatch): Observable<Task> {
    return this.http
      .patch<Task>(API_PATHS.taskById(taskId), patch, {
        headers: this.auth.authHeaders(),
      })
      .pipe(
        tap((task) =>
          this.tasksSignal.update((list) =>
            list.map((item) => (item.id === taskId ? task : item)),
          ),
        ),
      );
  }

  updateTaskStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status });
  }

  deleteTask(taskId: string): Observable<void> {
    return this.http
      .delete<{ ok: boolean }>(API_PATHS.taskById(taskId), {
        headers: this.auth.authHeaders(),
      })
      .pipe(
        tap(() =>
          this.tasksSignal.update((list) =>
            list.filter((item) => item.id !== taskId),
          ),
        ),
        map(() => undefined),
      );
  }

  addComment(taskId: string, message: string): Observable<Task> {
    return this.updateTask(taskId, { comment: message });
  }

  setAssigneeFilter(value: string | 'all'): void {
    this.assigneeFilter.set(value);
  }

  setPriorityFilter(value: TaskPriority | 'all'): void {
    this.priorityFilter.set(value);
  }

  resetFilters(): void {
    this.assigneeFilter.set('all');
    this.priorityFilter.set('all');
  }

  getTaskById(taskId: string): Task | undefined {
    return this.tasksSignal().find((task) => task.id === taskId);
  }
}
