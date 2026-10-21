/**
 * Auth session state is owned by AuthService (signals + localStorage).
 * Prefer AuthService for login/register/logout; this façade exists for
 * state-layer imports (`state/auth.store`).
 */
export { AuthService as AuthStore } from './auth.service';
export { AuthService } from './auth.service';
