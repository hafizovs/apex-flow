export type Role = 'admin' | 'manager' | 'developer';

export type TaskPriority = 'high' | 'medium' | 'low';

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'done';

/** Alias for Kanban column id — 1:1 with TaskStatus in v1 */
export type ColumnId = TaskStatus;

export type ThemeId = 'dark' | 'light';

export type LocaleId = 'ru' | 'en';

export type TaskChangeField =
  | 'status'
  | 'title'
  | 'description'
  | 'assigneeId'
  | 'priority'
  | 'tags'
  | 'comment';

export type SortDirection = 'asc' | 'desc';

export type TeamModalMode = 'add' | 'edit' | null;

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
  /** Never expose in API responses to non-admin; stored hashed in mock-db only */
  passwordHash?: string;
}

export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  password: string;
  role: Role;
}

export interface UpdateUserInput {
  displayName?: string;
  role?: Role;
  isBlocked?: boolean;
}

export interface AuthSession {
  token: string;
  user: UserPublic;
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  displayName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface StoredSession {
  token: string;
  user: UserPublic;
  expiresAt: string;
}

export interface TaskChangeLogEntry {
  id: string;
  at: string;
  authorId: string;
  authorName: string;
  field: TaskChangeField;
  oldValue: string | null;
  newValue: string | null;
  message: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  priority: TaskPriority;
  tags: string[];
  status: TaskStatus;
  changeLog: TaskChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigneeId: string;
  priority: TaskPriority;
  tags: string[];
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  tags?: string[];
  status?: TaskStatus;
}

export interface KanbanColumn {
  id: ColumnId;
  titleKey: string;
  order: number;
  taskIds: string[];
}

export interface KanbanColumnDef {
  id: ColumnId;
  titleKey: string;
  order: number;
}

export interface AnalyticsPoint {
  date: string;
  remainingTasks: number;
  completedTasks: number;
  totalScope: number;
}

export interface PriorityStat {
  priority: TaskPriority;
  count: number;
  labelKey: string;
}

export interface AnalyticsSummary {
  totalTasks: number;
  doneTasks: number;
  inProgressTasks: number;
  overdueEstimate: number;
  priorityStats: PriorityStat[];
  burndownPoints: AnalyticsPoint[];
  completionRate: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TeamQuery {
  page: number;
  pageSize: number;
  search: string;
  roleFilter: Role | 'all';
  sortBy: 'email' | 'displayName' | 'createdAt' | 'role';
  sortDirection: SortDirection;
}

export interface TeamMemberDraft {
  email: string;
  displayName: string;
  password: string;
  role: Role;
}

export interface ApiError {
  status: number;
  code: string;
  message: string;
}

export interface ApiListResponse<T> {
  data: T;
}

export interface LoginResponse {
  session: AuthSession;
}

export interface TasksResponse {
  tasks: Task[];
}
