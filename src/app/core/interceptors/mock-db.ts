import type {
  User,
  UserPublic,
  Task,
  TaskChangeLogEntry,
  TaskChangeField,
  TaskPriority,
  TaskStatus,
} from '../models/app.types';
import { hashPassword } from '../../domain/auth/password.validators';
import { createId } from '../../domain/shared/id-factory';
import { SEED_ADMIN_ID } from '../constants/auth.constants';

export interface MockDatabase {
  users: User[];
  tasks: Task[];
  sessions: Map<string, string>; // token -> userId
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
  };
}

export function createChangeLogEntry(params: {
  field: TaskChangeField;
  oldValue: string | null;
  newValue: string | null;
  message: string;
  author: Pick<UserPublic, 'id' | 'displayName'>;
  at?: string;
}): TaskChangeLogEntry {
  return {
    id: createId('log'),
    at: params.at ?? new Date().toISOString(),
    authorId: params.author.id,
    authorName: params.author.displayName,
    field: params.field,
    oldValue: params.oldValue,
    newValue: params.newValue,
    message: params.message,
  };
}

function daysAgoIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function createSeedUsers(): User[] {
  return [
    {
      id: 'usr_admin',
      email: 'admin@apexflow.dev',
      displayName: 'Alex Admin',
      role: 'admin',
      isBlocked: false,
      createdAt: '2026-01-01T00:00:00.000Z',
      passwordHash: hashPassword('Admin123!'),
    },
    {
      id: 'usr_manager',
      email: 'manager@apexflow.dev',
      displayName: 'Mia Manager',
      role: 'manager',
      isBlocked: false,
      createdAt: '2026-01-02T00:00:00.000Z',
      passwordHash: hashPassword('Manager123!'),
    },
    {
      id: 'usr_dev',
      email: 'dev@apexflow.dev',
      displayName: 'Dan Developer',
      role: 'developer',
      isBlocked: false,
      createdAt: '2026-01-03T00:00:00.000Z',
      passwordHash: hashPassword('Dev12345!'),
    },
    {
      id: 'usr_dev2',
      email: 'julia@apexflow.dev',
      displayName: 'Julia Frontend',
      role: 'developer',
      isBlocked: false,
      createdAt: '2026-01-04T00:00:00.000Z',
      passwordHash: hashPassword('Dev12345!'),
    },
  ];
}

type SeedTaskDef = {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

function createSeedTasks(): Task[] {
  const defs: SeedTaskDef[] = [
    {
      id: 'tsk_01',
      title: 'Настроить CI pipeline',
      description:
        'Подключить GitHub Actions для сборки, линтинга и unit-тестов на каждый push. Добавить кэш зависимостей и статусный бейдж в README.',
      assigneeId: 'usr_dev',
      assigneeName: 'Dan Developer',
      priority: 'high',
      tags: ['devops', 'ci'],
      status: 'in_progress',
      createdAt: daysAgoIso(12),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'tsk_02',
      title: 'Дизайн Kanban карточек',
      description:
        'Сверстать визуальный стиль карточек: приоритет, теги, исполнитель. Согласовать отступы и контраст для тёмной и светлой темы.',
      assigneeId: 'usr_dev2',
      assigneeName: 'Julia Frontend',
      priority: 'medium',
      tags: ['ui', 'design'],
      status: 'review',
      createdAt: daysAgoIso(11),
      updatedAt: daysAgoIso(2),
    },
    {
      id: 'tsk_03',
      title: 'Mock API interceptor',
      description:
        'Реализовать HttpInterceptor с in-memory REST, Bearer-авторизацией и сетевой задержкой 800 мс. Покрыть основные auth и task эндпоинты.',
      assigneeId: 'usr_dev',
      assigneeName: 'Dan Developer',
      priority: 'high',
      tags: ['backend', 'mock'],
      status: 'done',
      createdAt: daysAgoIso(10),
      updatedAt: daysAgoIso(3),
    },
    {
      id: 'tsk_04',
      title: 'RBAC guards',
      description:
        'Добавить functional guards для защиты маршрутов по ролям admin, manager и developer. Проверить редиректы на /login и /board.',
      assigneeId: 'usr_admin',
      assigneeName: 'Alex Admin',
      priority: 'high',
      tags: ['auth', 'security'],
      status: 'done',
      createdAt: daysAgoIso(9),
      updatedAt: daysAgoIso(4),
    },
    {
      id: 'tsk_05',
      title: 'Burndown chart SVG',
      description:
        'Построить SVG line chart burndown за последние 7 дней по формулам Appendix B. Добавить подписи осей и точки на линии.',
      assigneeId: 'usr_manager',
      assigneeName: 'Mia Manager',
      priority: 'medium',
      tags: ['analytics'],
      status: 'in_progress',
      createdAt: daysAgoIso(8),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'tsk_06',
      title: 'Страница регистрации',
      description:
        'Собрать форму регистрации с проверкой силы пароля, подтверждением и чекбоксом условий. После успеха — автоматический вход на доску.',
      assigneeId: 'usr_dev2',
      assigneeName: 'Julia Frontend',
      priority: 'low',
      tags: ['auth'],
      status: 'backlog',
      createdAt: daysAgoIso(7),
      updatedAt: daysAgoIso(7),
    },
    {
      id: 'tsk_07',
      title: 'Фильтры доски',
      description:
        'Реализовать фильтрацию задач по исполнителю и приоритету через computed signals. Сброс фильтров одной кнопкой.',
      assigneeId: 'usr_dev',
      assigneeName: 'Dan Developer',
      priority: 'medium',
      tags: ['board'],
      status: 'backlog',
      createdAt: daysAgoIso(6),
      updatedAt: daysAgoIso(6),
    },
    {
      id: 'tsk_08',
      title: 'Team pagination',
      description:
        'Таблица пользователей с пагинацией, поиском по email/имени, фильтром роли и сортировкой. Серверная логика в mock API.',
      assigneeId: 'usr_admin',
      assigneeName: 'Alex Admin',
      priority: 'high',
      tags: ['admin'],
      status: 'review',
      createdAt: daysAgoIso(5),
      updatedAt: daysAgoIso(2),
    },
    {
      id: 'tsk_09',
      title: 'i18n словари',
      description:
        'Подготовить зеркальные словари RU/EN и I18nService на signals. Все видимые строки UI должны идти через t().',
      assigneeId: 'usr_dev2',
      assigneeName: 'Julia Frontend',
      priority: 'low',
      tags: ['i18n'],
      status: 'done',
      createdAt: daysAgoIso(13),
      updatedAt: daysAgoIso(5),
    },
    {
      id: 'tsk_10',
      title: 'Theme toggle',
      description:
        'Переключение тёмной и светлой темы с записью в localStorage и атрибутом data-theme на documentElement.',
      assigneeId: 'usr_dev',
      assigneeName: 'Dan Developer',
      priority: 'low',
      tags: ['ui'],
      status: 'done',
      createdAt: daysAgoIso(14),
      updatedAt: daysAgoIso(6),
    },
    {
      id: 'tsk_11',
      title: 'E2E test plan',
      description:
        'Описать end-to-end сценарии: логин, DnD карточки, создание задачи, admin demo reset. Зафиксировать ожидаемые артефакты.',
      assigneeId: 'usr_manager',
      assigneeName: 'Mia Manager',
      priority: 'medium',
      tags: ['qa'],
      status: 'backlog',
      createdAt: daysAgoIso(2),
      updatedAt: daysAgoIso(2),
    },
    {
      id: 'tsk_12',
      title: 'Оптимизация DnD',
      description:
        'Сгладить pointer tracking и hit-test колонок без CDK. Убрать лишние обновления signals во время перетаскивания.',
      assigneeId: 'usr_dev',
      assigneeName: 'Dan Developer',
      priority: 'high',
      tags: ['perf'],
      status: 'in_progress',
      createdAt: daysAgoIso(1),
      updatedAt: daysAgoIso(0),
    },
    {
      id: 'tsk_13',
      title: 'KPI cards',
      description:
        'Карточки KPI на аналитике: всего задач, выполнено, в работе, процент завершения. Данные из buildAnalyticsSummary.',
      assigneeId: 'usr_manager',
      assigneeName: 'Mia Manager',
      priority: 'medium',
      tags: ['analytics'],
      status: 'review',
      createdAt: daysAgoIso(4),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'tsk_14',
      title: 'Password validators',
      description:
        'Валидаторы силы пароля и совпадения подтверждения для регистрации и создания пользователей командой.',
      assigneeId: 'usr_dev2',
      assigneeName: 'Julia Frontend',
      priority: 'medium',
      tags: ['auth'],
      status: 'in_progress',
      createdAt: daysAgoIso(3),
      updatedAt: daysAgoIso(0),
    },
    {
      id: 'tsk_15',
      title: 'Demo reset endpoint',
      description:
        'POST /api/demo/reset для admin: очистка сессий и перезагрузка SEED_USERS / SEED_TASKS. Клиент показывает toast после успеха.',
      assigneeId: 'usr_admin',
      assigneeName: 'Alex Admin',
      priority: 'low',
      tags: ['admin'],
      status: 'backlog',
      createdAt: daysAgoIso(8),
      updatedAt: daysAgoIso(8),
    },
  ];

  return defs.map((task) => ({
    ...task,
    changeLog: [
      createChangeLogEntry({
        field: 'status',
        oldValue: null,
        newValue: task.status,
        message: 'created',
        author: { id: task.assigneeId, displayName: task.assigneeName },
        at: task.createdAt,
      }),
    ],
  }));
}

function createSeedDatabase(): MockDatabase {
  return {
    users: createSeedUsers(),
    tasks: createSeedTasks(),
    sessions: new Map<string, string>(),
  };
}

/** Mutable in-memory database used by the mock API interceptor. */
export const mockDb: MockDatabase = createSeedDatabase();

export function resetMockDb(): void {
  const next = createSeedDatabase();
  mockDb.users = next.users;
  mockDb.tasks = next.tasks;
  mockDb.sessions = next.sessions;
}

export function findUserByToken(token: string): User | undefined {
  const userId = mockDb.sessions.get(token);
  if (!userId) {
    return undefined;
  }
  return mockDb.users.find((u) => u.id === userId);
}

export function findUserByEmail(email: string): User | undefined {
  const normalized = email.trim().toLowerCase();
  return mockDb.users.find((u) => u.email.toLowerCase() === normalized);
}

export function findUserById(id: string): User | undefined {
  return mockDb.users.find((u) => u.id === id);
}

export function findTaskById(id: string): Task | undefined {
  return mockDb.tasks.find((t) => t.id === id);
}

export function isProtectedAdmin(userId: string): boolean {
  return userId === SEED_ADMIN_ID;
}

export function cloneTask(task: Task): Task {
  return {
    ...task,
    tags: [...task.tags],
    changeLog: task.changeLog.map((entry) => ({ ...entry })),
  };
}

export function cloneUser(user: User): User {
  return { ...user };
}
