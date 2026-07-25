export const NETWORK_DELAY_MS = 800;

export const API_BASE = '/api';

export const API_PATHS = {
  authLogin: '/api/auth/login',
  authRegister: '/api/auth/register',
  authLogout: '/api/auth/logout',
  authMe: '/api/auth/me',
  tasks: '/api/tasks',
  taskById: (id: string) => `/api/tasks/${id}`,
  users: '/api/users',
  userById: (id: string) => `/api/users/${id}`,
  usersAssignees: '/api/users/assignees',
  demoReset: '/api/demo/reset',
} as const;
