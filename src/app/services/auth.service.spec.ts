/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SESSION_STORAGE_KEY } from '../core/constants/auth.constants';
import type { AuthSession } from '../models/app.types';

const sampleSession: AuthSession = {
  token: 'afx_tok_usr_admin_abc1234567890123456789012345678',
  user: {
    id: 'usr_admin',
    email: 'admin@apexflow.dev',
    displayName: 'Alex',
    role: 'admin',
    isBlocked: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  expiresAt: '2030-01-01T00:00:00.000Z',
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('restoreSession ignores expired storage', () => {
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({
        ...sampleSession,
        expiresAt: '2020-01-01T00:00:00.000Z',
      }),
    );
    service.restoreSession();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('restoreSession loads valid session', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sampleSession));
    service.restoreSession();
    expect(service.isAuthenticated()).toBe(true);
    expect(service.currentUser()?.id).toBe('usr_admin');
  });

  it('login updates session signal and navigates', () => {
    service.login({ email: 'admin@apexflow.dev', password: 'Admin123!' }).subscribe();
    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ session: sampleSession });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasRole('admin')).toBe(true);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeTruthy();
    expect(router.navigate).toHaveBeenCalledWith(['/board']);
    httpMock.verify();
  });

  it('logout clears session and storage', () => {
    service.setSession(sampleSession);
    service.logout();
    const logoutReq = httpMock.expectOne('/api/auth/logout');
    logoutReq.flush({ ok: true });
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
    httpMock.verify();
  });

  it('hasRole and hasAnyRole check current user', () => {
    service.setSession({
      ...sampleSession,
      user: { ...sampleSession.user, role: 'manager' },
    });
    expect(service.hasRole('manager')).toBe(true);
    expect(service.hasRole('admin')).toBe(false);
    expect(service.hasAnyRole(['admin', 'manager'])).toBe(true);
    expect(service.hasAnyRole(['admin'])).toBe(false);
  });
});
