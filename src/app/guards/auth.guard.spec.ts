import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  it('allows authenticated users', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(result).toBe(true);
  });

  it('redirects guests to login', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => false },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(String(result)).toContain('login');
  });
});

describe('guestGuard', () => {
  it('redirects authenticated users to board', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated: () => true },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));
    expect(String(result)).toContain('board');
  });
});
