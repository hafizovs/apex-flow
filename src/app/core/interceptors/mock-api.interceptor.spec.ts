/** @vitest-environment jsdom */
import '@angular/compiler';
import {
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
  type HttpHandlerFn,
} from '@angular/common/http';
import { Injector, runInInjectionContext, signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NETWORK_DELAY_MS } from '../constants/api.constants';
import type { AuthSession } from '../models/app.types';
import { AuthService } from '../../features/auth/auth.service';
import { mockApiInterceptor } from './mock-api.interceptor';
import { resetMockDb } from './mock-db';

describe('mockApiInterceptor', () => {
  const sessionSignal = signal<AuthSession | null>(null);
  const passthrough: HttpHandlerFn = () => of(new HttpResponse({ status: 200, body: null }));

  function run(req: HttpRequest<unknown>) {
    const injector = Injector.create({
      providers: [
        {
          provide: AuthService,
          useValue: {
            session: sessionSignal.asReadonly(),
          },
        },
      ],
    });
    return runInInjectionContext(injector, () => mockApiInterceptor(req, passthrough));
  }

  beforeEach(() => {
    resetMockDb();
    sessionSignal.set(null);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`delays API responses by roughly ${NETWORK_DELAY_MS}ms`, async () => {
    const pending = firstValueFrom(
      run(
        new HttpRequest('POST', '/api/auth/login', {
          email: 'admin@apexflow.dev',
          password: 'Admin123!',
        }),
      ),
    );

    let settled = false;
    void pending.then(() => {
      settled = true;
    });

    await vi.advanceTimersByTimeAsync(NETWORK_DELAY_MS - 50);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(100);
    const response = (await pending) as HttpResponse<{ session: AuthSession }>;
    expect(settled).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body?.session.token).toBeTruthy();
    expect(response.body?.session.user.email).toBe('admin@apexflow.dev');
  });

  it('returns 401 for GET /api/tasks without a token', async () => {
    const pending = firstValueFrom(run(new HttpRequest('GET', '/api/tasks')));

    let status: number | null = null;
    void pending.catch((err: unknown) => {
      if (err instanceof HttpErrorResponse) {
        status = err.status;
      }
    });

    await vi.advanceTimersByTimeAsync(NETWORK_DELAY_MS + 50);

    await expect(pending).rejects.toBeInstanceOf(HttpErrorResponse);
    expect(status).toBe(401);
  });

  it('logs in successfully with seed admin credentials', async () => {
    const pending = firstValueFrom(
      run(
        new HttpRequest('POST', '/api/auth/login', {
          email: 'admin@apexflow.dev',
          password: 'Admin123!',
        }),
      ),
    );

    await vi.advanceTimersByTimeAsync(NETWORK_DELAY_MS + 50);
    const response = (await pending) as HttpResponse<{ session: AuthSession }>;
    const session = response.body!.session;

    expect(session.token.startsWith('afx_tok_')).toBe(true);
    expect(session.user.id).toBe('usr_admin');
    expect(session.user.role).toBe('admin');
    expect(session.user.displayName).toBe('Alex Admin');
    expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});
