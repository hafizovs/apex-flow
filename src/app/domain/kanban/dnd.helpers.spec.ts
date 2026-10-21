/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ColumnId, Task } from '../../core/models/app.types';
import {
  canDropTask,
  findColumnIdFromElement,
  findColumnIdFromPoint,
} from './dnd.helpers';

function makeTask(): Task {
  return {
    id: 'tsk_1',
    title: 'Test',
    description: '',
    assigneeId: 'usr_dev',
    assigneeName: 'Dan',
    priority: 'medium',
    tags: [],
    status: 'backlog',
    changeLog: [],
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
  };
}

describe('dnd.helpers', () => {
  describe('canDropTask', () => {
    it('always returns true in v1', () => {
      const task = makeTask();
      const columns: ColumnId[] = [
        'backlog',
        'in_progress',
        'review',
        'done',
      ];
      for (const column of columns) {
        expect(canDropTask(task, column)).toBe(true);
      }
    });
  });

  describe('findColumnIdFromElement', () => {
    it('resolves column id from nested element', () => {
      const column = document.createElement('section');
      column.setAttribute('data-column-id', 'in_progress');
      const child = document.createElement('div');
      column.appendChild(child);
      expect(findColumnIdFromElement(child)).toBe('in_progress');
    });

    it('returns null for null or non-column elements', () => {
      expect(findColumnIdFromElement(null)).toBeNull();
      expect(findColumnIdFromElement(document.createElement('div'))).toBeNull();
    });
  });

  describe('findColumnIdFromPoint', () => {
    let map: Map<ColumnId, HTMLElement>;

    beforeEach(() => {
      map = new Map();
      const backlog = document.createElement('div');
      backlog.setAttribute('data-column-id', 'backlog');
      Object.defineProperty(backlog, 'getBoundingClientRect', {
        value: () => ({
          left: 0,
          right: 100,
          top: 0,
          bottom: 200,
          width: 100,
          height: 200,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        }),
      });

      const done = document.createElement('div');
      done.setAttribute('data-column-id', 'done');
      Object.defineProperty(done, 'getBoundingClientRect', {
        value: () => ({
          left: 200,
          right: 300,
          top: 0,
          bottom: 200,
          width: 100,
          height: 200,
          x: 200,
          y: 0,
          toJSON: () => ({}),
        }),
      });

      map.set('backlog', backlog);
      map.set('done', done);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('hits column via Map bounding boxes', () => {
      expect(findColumnIdFromPoint(50, 50, map)).toBe('backlog');
      expect(findColumnIdFromPoint(250, 50, map)).toBe('done');
    });

    it('returns null when point is outside all columns and no DOM hit', () => {
      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        writable: true,
        value: vi.fn().mockReturnValue(null),
      });
      expect(findColumnIdFromPoint(150, 50, map)).toBeNull();
    });

    it('falls back to elementFromPoint + closest', () => {
      const column = document.createElement('section');
      column.setAttribute('data-column-id', 'review');
      const child = document.createElement('div');
      column.appendChild(child);
      document.body.appendChild(column);

      Object.defineProperty(document, 'elementFromPoint', {
        configurable: true,
        writable: true,
        value: vi.fn().mockReturnValue(child),
      });

      expect(findColumnIdFromPoint(10, 10, new Map())).toBe('review');

      document.body.removeChild(column);
    });
  });
});
