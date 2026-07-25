import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
  it('allows matching role', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { hasAnyRole: (roles: string[]) => roles.includes('admin') },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: ['admin'] } } as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects developer away from team', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { hasAnyRole: () => false },
        },
      ],
    });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard({ data: { roles: ['admin'] } } as never, {} as never),
    );
    expect(String(result)).toContain('board');
  });
});
