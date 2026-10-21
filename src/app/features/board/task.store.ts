/**
 * Task list / filter state is owned by TaskService.
 * Prefer TaskService for CRUD and board filters; this façade exists for
 * state-layer imports (`state/task.store`).
 */
export { TaskService as TaskStore } from './task.service';
export { TaskService } from './task.service';
