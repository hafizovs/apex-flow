export type { Role } from '../../models/app.types';

import type { Role } from '../../models/app.types';

export const ROLES: readonly Role[] = ['admin', 'manager', 'developer'] as const;

export const ROLE_LABEL_KEYS: Record<Role, string> = {
  admin: 'role.admin',
  manager: 'role.manager',
  developer: 'role.developer',
};

export function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'manager' || value === 'developer';
}

export function roleLabelKey(role: Role): string {
  return ROLE_LABEL_KEYS[role];
}
