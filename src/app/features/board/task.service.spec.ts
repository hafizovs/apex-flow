/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { AuthService } from '../auth/auth.service';
import type { Task } from '../../core/models/app.types';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const sampleTask: Task = {
    id: 'tsk_1',
    title: 'Test',
    description: 'Desc',
    assigneeId: 'usr_dev',
    assigneeName: 'Dan',
    priority: 'high',
    tags: ['a'],
    status: 'backlog',
    changeLog: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        TaskService,
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).setSession({
      token: 'afx_tok_usr_admin_abc1234567890123456789012345678',
      user: {
        id: 'usr_admin',
        email: 'a',
        displayName: 'A',
        role: 'admin',
        isBlocked: false,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      expiresAt: '2030-01-01T00:00:00.000Z',
    });
  });

  it('filteredTasks respects assignee and priority', () => {
    service.loadTasks().subscribe();
    httpMock.expectOne('/api/tasks').flush({
      tasks: [
        sampleTask,
        {
          ...sampleTask,
          id: 'tsk_2',
          assigneeId: 'usr_dev2',
          priority: 'low',
        },
      ],
    });
    service.setAssigneeFilter('usr_dev');
    service.setPriorityFilter('high');
    expect(service.filteredTasks()).toHaveLength(1);
    expect(service.filteredTasks()[0]?.id).toBe('tsk_1');
    httpMock.verify();
  });

  it('columns groups by status', () => {
    service.loadTasks().subscribe();
    httpMock.expectOne('/api/tasks').flush({
      tasks: [sampleTask, { ...sampleTask, id: 'tsk_2', status: 'done' }],
    });
    const cols = service.columns();
    expect(cols.find((c) => c.id === 'backlog')?.taskIds).toContain('tsk_1');
    expect(cols.find((c) => c.id === 'done')?.taskIds).toContain('tsk_2');
    httpMock.verify();
  });

  it('updateTaskStatus calls PATCH and updates signal', () => {
    service.loadTasks().subscribe();
    httpMock.expectOne('/api/tasks').flush({ tasks: [sampleTask] });
    service.updateTaskStatus('tsk_1', 'in_progress').subscribe();
    const patch = httpMock.expectOne('/api/tasks/tsk_1');
    expect(patch.request.method).toBe('PATCH');
    patch.flush({ ...sampleTask, status: 'in_progress' });
    expect(service.tasks()[0]?.status).toBe('in_progress');
    httpMock.verify();
  });

  it('resetFilters clears assignee and priority', () => {
    service.setAssigneeFilter('usr_dev');
    service.setPriorityFilter('high');
    service.resetFilters();
    expect(service.assigneeFilter()).toBe('all');
    expect(service.priorityFilter()).toBe('all');
  });
});
