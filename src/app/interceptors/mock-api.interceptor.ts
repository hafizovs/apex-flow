import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { delay, of, switchMap, throwError } from 'rxjs';
import { NETWORK_DELAY_MS } from '../core/constants/api.constants';
import { SEED_ADMIN_ID, SESSION_TTL_DAYS } from '../core/constants/auth.constants';
import {
  MAX_TAG_LENGTH,
  MAX_TAGS,
  MAX_TASK_DESCRIPTION,
  MAX_TASK_TITLE,
} from '../core/constants/kanban.constants';
import { DEFAULT_PAGE_SIZE } from '../core/constants/ui.constants';
import { hashPassword, verifyPassword } from '../domain/auth/password.validators';
import { generateToken } from '../domain/auth/token.helpers';
import { createId } from '../domain/shared/id-factory';
import type {
  AuthSession,
  CreateTaskInput,
  CreateUserInput,
  LoginCredentials,
  PaginatedResult,
  RegisterPayload,
  Role,
  SortDirection,
  Task,
  TaskChangeField,
  UpdateTaskInput,
  UpdateUserInput,
  User,
  UserPublic,
} from '../models/app.types';
import { AuthService } from '../services/auth.service';
import {
  cloneTask,
  createChangeLogEntry,
  findTaskById,
  findUserByEmail,
  findUserById,
  findUserByToken,
  isProtectedAdmin,
  mockDb,
  resetMockDb,
  toPublicUser,
} from './mock-db';

type TaskPatchBody = UpdateTaskInput & { comment?: string };

interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
}

function apiError(status: number, code: string, message: string): HttpErrorResponse {
  const body: ApiErrorBody = { status, code, message };
  return new HttpErrorResponse({
    status,
    statusText: message,
    error: body,
  });
}

function ok<T>(body: T, status = 200): HttpResponse<T> {
  return new HttpResponse({ status, body });
}

function extractBearer(req: HttpRequest<unknown>): string | null {
  const header = req.headers.get('Authorization');
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function sessionExpiresAt(): string {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + SESSION_TTL_DAYS);
  return expires.toISOString();
}

function createSession(user: User): AuthSession {
  const token = generateToken(user.id);
  mockDb.sessions.set(token, user.id);
  return {
    token,
    user: toPublicUser(user),
    expiresAt: sessionExpiresAt(),
  };
}

function requireUser(req: HttpRequest<unknown>): User {
  const token = extractBearer(req);
  if (!token) {
    throw apiError(401, 'UNAUTHORIZED', 'Authentication required');
  }
  const user = findUserByToken(token);
  if (!user) {
    throw apiError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
  if (user.isBlocked) {
    throw apiError(403, 'FORBIDDEN', 'User is blocked');
  }
  return user;
}

function requireRoles(user: User, roles: Role[]): void {
  if (!roles.includes(user.role)) {
    throw apiError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) {
    return [];
  }
  const normalized = tags
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, MAX_TAG_LENGTH));
  return [...new Set(normalized)].slice(0, MAX_TAGS);
}

function validateTaskTitle(title: unknown): string {
  const value = String(title ?? '').trim();
  if (!value) {
    throw apiError(422, 'VALIDATION', 'Title is required');
  }
  if (value.length > MAX_TASK_TITLE) {
    throw apiError(422, 'VALIDATION', `Title must be at most ${MAX_TASK_TITLE} characters`);
  }
  return value;
}

function validateTaskDescription(description: unknown): string {
  const value = String(description ?? '');
  if (value.length > MAX_TASK_DESCRIPTION) {
    throw apiError(
      422,
      'VALIDATION',
      `Description must be at most ${MAX_TASK_DESCRIPTION} characters`,
    );
  }
  return value;
}

function resolveAssigneeName(assigneeId: string): string {
  const assignee = findUserById(assigneeId);
  if (!assignee) {
    throw apiError(422, 'VALIDATION', 'Assignee not found');
  }
  return assignee.displayName;
}

function appendFieldChange(
  task: Task,
  author: UserPublic,
  field: TaskChangeField,
  oldValue: string | null,
  newValue: string | null,
  message: string,
): void {
  task.changeLog = [
    ...task.changeLog,
    createChangeLogEntry({
      field,
      oldValue,
      newValue,
      message,
      author,
    }),
  ];
}

function handleLogin(body: unknown): HttpResponse<{ session: AuthSession }> {
  const credentials = (body ?? {}) as LoginCredentials;
  const email = String(credentials.email ?? '').trim();
  const password = String(credentials.password ?? '');
  if (!email || !password) {
    throw apiError(422, 'VALIDATION', 'Email and password are required');
  }
  const user = findUserByEmail(email);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    throw apiError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }
  if (user.isBlocked) {
    throw apiError(403, 'FORBIDDEN', 'User is blocked');
  }
  return ok({ session: createSession(user) });
}

function handleRegister(body: unknown): HttpResponse<{ session: AuthSession }> {
  const payload = (body ?? {}) as RegisterPayload;
  const email = String(payload.email ?? '').trim().toLowerCase();
  const displayName = String(payload.displayName ?? '').trim();
  const password = String(payload.password ?? '');

  if (!email || !displayName || !password) {
    throw apiError(422, 'VALIDATION', 'Email, display name and password are required');
  }
  if (displayName.length < 2 || displayName.length > 60) {
    throw apiError(422, 'VALIDATION', 'Display name must be 2–60 characters');
  }
  if (findUserByEmail(email)) {
    throw apiError(409, 'CONFLICT', 'Email already registered');
  }

  const user: User = {
    id: createId('usr'),
    email,
    displayName,
    role: 'developer',
    isBlocked: false,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };
  mockDb.users = [...mockDb.users, user];
  return ok({ session: createSession(user) }, 201);
}

function handleLogout(req: HttpRequest<unknown>): HttpResponse<{ ok: true }> {
  const token = extractBearer(req);
  if (token) {
    mockDb.sessions.delete(token);
  }
  return ok({ ok: true });
}

function handleMe(req: HttpRequest<unknown>): HttpResponse<{ user: UserPublic }> {
  const user = requireUser(req);
  return ok({ user: toPublicUser(user) });
}

function handleGetTasks(req: HttpRequest<unknown>): HttpResponse<{ tasks: Task[] }> {
  requireUser(req);
  return ok({ tasks: mockDb.tasks.map(cloneTask) });
}

function handleCreateTask(req: HttpRequest<unknown>, body: unknown): HttpResponse<Task> {
  const user = requireUser(req);
  const input = (body ?? {}) as CreateTaskInput;
  const title = validateTaskTitle(input.title);
  const description = validateTaskDescription(input.description);
  const assigneeId = String(input.assigneeId ?? '').trim();
  if (!assigneeId) {
    throw apiError(422, 'VALIDATION', 'Assignee is required');
  }
  const assigneeName = resolveAssigneeName(assigneeId);
  const priority = input.priority;
  if (priority !== 'high' && priority !== 'medium' && priority !== 'low') {
    throw apiError(422, 'VALIDATION', 'Invalid priority');
  }
  const status = input.status ?? 'backlog';
  const now = new Date().toISOString();
  const author = toPublicUser(user);
  const task: Task = {
    id: createId('tsk'),
    title,
    description,
    assigneeId,
    assigneeName,
    priority,
    tags: normalizeTags(input.tags),
    status,
    changeLog: [
      createChangeLogEntry({
        field: 'status',
        oldValue: null,
        newValue: status,
        message: 'created',
        author,
        at: now,
      }),
    ],
    createdAt: now,
    updatedAt: now,
  };
  mockDb.tasks = [...mockDb.tasks, task];
  return ok(cloneTask(task), 201);
}

function handlePatchTask(req: HttpRequest<unknown>, id: string, body: unknown): HttpResponse<Task> {
  const user = requireUser(req);
  const index = mockDb.tasks.findIndex((t) => t.id === id);
  if (index < 0) {
    throw apiError(404, 'NOT_FOUND', 'Task not found');
  }

  const existing = cloneTask(mockDb.tasks[index]!);
  const patch = (body ?? {}) as TaskPatchBody;
  const author = toPublicUser(user);
  const now = new Date().toISOString();

  if (typeof patch.comment === 'string') {
    const comment = patch.comment.trim();
    if (!comment) {
      throw apiError(422, 'VALIDATION', 'Comment cannot be empty');
    }
    appendFieldChange(existing, author, 'comment', null, comment, comment);
    existing.updatedAt = now;
    mockDb.tasks = mockDb.tasks.map((t, i) => (i === index ? existing : t));
    return ok(cloneTask(existing));
  }

  if (patch.title !== undefined) {
    const next = validateTaskTitle(patch.title);
    if (next !== existing.title) {
      appendFieldChange(existing, author, 'title', existing.title, next, 'title changed');
      existing.title = next;
    }
  }

  if (patch.description !== undefined) {
    const next = validateTaskDescription(patch.description);
    if (next !== existing.description) {
      appendFieldChange(
        existing,
        author,
        'description',
        existing.description,
        next,
        'description changed',
      );
      existing.description = next;
    }
  }

  if (patch.assigneeId !== undefined) {
    const nextId = String(patch.assigneeId).trim();
    if (nextId !== existing.assigneeId) {
      const nextName = resolveAssigneeName(nextId);
      appendFieldChange(
        existing,
        author,
        'assigneeId',
        existing.assigneeId,
        nextId,
        'assignee changed',
      );
      existing.assigneeId = nextId;
      existing.assigneeName = nextName;
    }
  }

  if (patch.priority !== undefined) {
    const next = patch.priority;
    if (next !== 'high' && next !== 'medium' && next !== 'low') {
      throw apiError(422, 'VALIDATION', 'Invalid priority');
    }
    if (next !== existing.priority) {
      appendFieldChange(existing, author, 'priority', existing.priority, next, 'priority changed');
      existing.priority = next;
    }
  }

  if (patch.tags !== undefined) {
    const next = normalizeTags(patch.tags);
    const oldJoined = existing.tags.join(',');
    const newJoined = next.join(',');
    if (oldJoined !== newJoined) {
      appendFieldChange(existing, author, 'tags', oldJoined, newJoined, 'tags changed');
      existing.tags = next;
    }
  }

  if (patch.status !== undefined) {
    const next = patch.status;
    if (
      next !== 'backlog' &&
      next !== 'in_progress' &&
      next !== 'review' &&
      next !== 'done'
    ) {
      throw apiError(422, 'VALIDATION', 'Invalid status');
    }
    if (next !== existing.status) {
      appendFieldChange(existing, author, 'status', existing.status, next, 'status changed');
      existing.status = next;
    }
  }

  existing.updatedAt = now;
  mockDb.tasks = mockDb.tasks.map((t, i) => (i === index ? existing : t));
  return ok(cloneTask(existing));
}

function handleDeleteTask(req: HttpRequest<unknown>, id: string): HttpResponse<{ ok: true }> {
  const user = requireUser(req);
  const task = findTaskById(id);
  if (!task) {
    throw apiError(404, 'NOT_FOUND', 'Task not found');
  }
  const canDelete =
    user.role === 'admin' ||
    user.role === 'manager' ||
    (user.role === 'developer' && task.assigneeId === user.id);
  if (!canDelete) {
    throw apiError(403, 'FORBIDDEN', 'Cannot delete this task');
  }
  mockDb.tasks = mockDb.tasks.filter((t) => t.id !== id);
  return ok({ ok: true });
}

function handleGetUsers(req: HttpRequest<unknown>): HttpResponse<PaginatedResult<UserPublic>> {
  const user = requireUser(req);
  requireRoles(user, ['admin']);

  const params = req.params;
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const pageSize = Math.max(1, Number(params.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE);
  const search = (params.get('search') ?? '').trim().toLowerCase();
  const roleParam = (params.get('role') ?? 'all').trim();
  const sortBy = (params.get('sortBy') ?? 'createdAt') as
    | 'email'
    | 'displayName'
    | 'createdAt'
    | 'role';
  const sortDir = ((params.get('sortDir') ?? 'asc').toLowerCase() === 'desc'
    ? 'desc'
    : 'asc') as SortDirection;

  let items = mockDb.users.map(toPublicUser);

  if (search) {
    items = items.filter(
      (u) =>
        u.email.toLowerCase().includes(search) ||
        u.displayName.toLowerCase().includes(search),
    );
  }

  if (roleParam && roleParam !== 'all') {
    items = items.filter((u) => u.role === roleParam);
  }

  const allowedSort = new Set(['email', 'displayName', 'createdAt', 'role']);
  const key = allowedSort.has(sortBy) ? sortBy : 'createdAt';
  items = [...items].sort((a, b) => {
    const cmp = String(a[key]).localeCompare(String(b[key]));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return ok({
    items: pageItems,
    total,
    page,
    pageSize,
    totalPages,
  });
}

function handleGetAssignees(req: HttpRequest<unknown>): HttpResponse<UserPublic[]> {
  requireUser(req);
  const assignees = mockDb.users.filter((u) => !u.isBlocked).map(toPublicUser);
  return ok(assignees);
}

function handleCreateUser(req: HttpRequest<unknown>, body: unknown): HttpResponse<UserPublic> {
  const actor = requireUser(req);
  requireRoles(actor, ['admin']);

  const input = (body ?? {}) as CreateUserInput;
  const email = String(input.email ?? '').trim().toLowerCase();
  const displayName = String(input.displayName ?? '').trim();
  const password = String(input.password ?? '');
  const role = input.role;

  if (!email || !displayName || !password) {
    throw apiError(422, 'VALIDATION', 'Email, display name and password are required');
  }
  if (role !== 'admin' && role !== 'manager' && role !== 'developer') {
    throw apiError(422, 'VALIDATION', 'Invalid role');
  }
  if (findUserByEmail(email)) {
    throw apiError(409, 'CONFLICT', 'Email already registered');
  }

  const user: User = {
    id: createId('usr'),
    email,
    displayName,
    role,
    isBlocked: false,
    createdAt: new Date().toISOString(),
    passwordHash: hashPassword(password),
  };
  mockDb.users = [...mockDb.users, user];
  return ok(toPublicUser(user), 201);
}

function handlePatchUser(
  req: HttpRequest<unknown>,
  id: string,
  body: unknown,
): HttpResponse<UserPublic> {
  const actor = requireUser(req);
  requireRoles(actor, ['admin']);

  const index = mockDb.users.findIndex((u) => u.id === id);
  if (index < 0) {
    throw apiError(404, 'NOT_FOUND', 'User not found');
  }

  const existing = { ...mockDb.users[index]! };
  const patch = (body ?? {}) as UpdateUserInput;

  if (isProtectedAdmin(id) || id === SEED_ADMIN_ID) {
    if (patch.isBlocked === true) {
      throw apiError(403, 'FORBIDDEN', 'Cannot block seed admin');
    }
    if (patch.role !== undefined && patch.role !== 'admin') {
      throw apiError(403, 'FORBIDDEN', 'Cannot demote seed admin');
    }
  }

  if (patch.displayName !== undefined) {
    const name = String(patch.displayName).trim();
    if (name.length < 2 || name.length > 60) {
      throw apiError(422, 'VALIDATION', 'Display name must be 2–60 characters');
    }
    existing.displayName = name;
  }

  if (patch.role !== undefined) {
    if (patch.role !== 'admin' && patch.role !== 'manager' && patch.role !== 'developer') {
      throw apiError(422, 'VALIDATION', 'Invalid role');
    }
    existing.role = patch.role;
  }

  if (patch.isBlocked !== undefined) {
    existing.isBlocked = Boolean(patch.isBlocked);
  }

  mockDb.users = mockDb.users.map((u, i) => (i === index ? existing : u));
  return ok(toPublicUser(existing));
}

function handleDemoReset(req: HttpRequest<unknown>): HttpResponse<{ ok: true }> {
  const user = requireUser(req);
  requireRoles(user, ['admin']);
  resetMockDb();
  return ok({ ok: true });
}

function matchTaskId(url: string): string | null {
  const match = /^\/api\/tasks\/([^/?#]+)/.exec(url);
  return match?.[1] ?? null;
}

function matchUserId(url: string): string | null {
  const match = /^\/api\/users\/([^/?#]+)/.exec(url);
  return match?.[1] ?? null;
}

function resolveHandler(req: HttpRequest<unknown>): HttpResponse<unknown> {
  const method = req.method.toUpperCase();
  const path = req.url.split('?')[0] ?? req.url;

  if (method === 'POST' && path === '/api/auth/login') {
    return handleLogin(req.body);
  }
  if (method === 'POST' && path === '/api/auth/register') {
    return handleRegister(req.body);
  }
  if (method === 'POST' && path === '/api/auth/logout') {
    return handleLogout(req);
  }
  if (method === 'GET' && path === '/api/auth/me') {
    return handleMe(req);
  }
  if (method === 'GET' && path === '/api/tasks') {
    return handleGetTasks(req);
  }
  if (method === 'POST' && path === '/api/tasks') {
    return handleCreateTask(req, req.body);
  }
  const taskId = matchTaskId(path);
  if (taskId && method === 'PATCH' && path === `/api/tasks/${taskId}`) {
    return handlePatchTask(req, decodeURIComponent(taskId), req.body);
  }
  if (taskId && method === 'DELETE' && path === `/api/tasks/${taskId}`) {
    return handleDeleteTask(req, decodeURIComponent(taskId));
  }
  if (method === 'GET' && path === '/api/users/assignees') {
    return handleGetAssignees(req);
  }
  if (method === 'GET' && path === '/api/users') {
    return handleGetUsers(req);
  }
  if (method === 'POST' && path === '/api/users') {
    return handleCreateUser(req, req.body);
  }
  const userId = matchUserId(path);
  if (
    userId &&
    userId !== 'assignees' &&
    method === 'PATCH' &&
    path === `/api/users/${userId}`
  ) {
    return handlePatchUser(req, decodeURIComponent(userId), req.body);
  }
  if (method === 'POST' && path === '/api/demo/reset') {
    return handleDemoReset(req);
  }

  throw apiError(404, 'NOT_FOUND', `No mock handler for ${method} ${path}`);
}

/**
 * In-memory mock REST API. Attaches Bearer from AuthService.session() when missing,
 * delays NETWORK_DELAY_MS, then routes to handlers. Token is always resolved from
 * the request Authorization header after the delay (avoids circular DI pitfalls).
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  let authReq = req;
  if (!extractBearer(req)) {
    const auth = inject(AuthService);
    const session = auth.session();
    if (session?.token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${session.token}` },
      });
    }
  }

  return of(null).pipe(
    delay(NETWORK_DELAY_MS),
    switchMap(() => {
      try {
        return of(resolveHandler(authReq));
      } catch (err) {
        const error =
          err instanceof HttpErrorResponse
            ? err
            : apiError(500, 'INTERNAL', 'Unexpected mock API error');
        return throwError(() => error);
      }
    }),
  );
};
