import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, finalize, map, tap } from 'rxjs';
import { API_PATHS } from '../../core/constants/api.constants';
import { SESSION_STORAGE_KEY } from '../../core/constants/auth.constants';
import type {
  AuthSession,
  LoginCredentials,
  LoginResponse,
  RegisterPayload,
  Role,
  StoredSession,
  UserPublic,
} from '../../core/models/app.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<AuthSession | null>(null);
  private readonly loadingSignal = signal(false);

  readonly session = this.sessionSignal.asReadonly();
  readonly currentUser = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly isLoading = this.loadingSignal.asReadonly();

  constructor() {
    this.restoreSession();
  }

  login(credentials: LoginCredentials): Observable<AuthSession> {
    this.loadingSignal.set(true);
    return this.http.post<LoginResponse>(API_PATHS.authLogin, credentials).pipe(
      map((res) => res.session),
      tap((session) => {
        this.setSession(session);
        void this.router.navigate(['/board']);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  register(payload: RegisterPayload): Observable<AuthSession> {
    this.loadingSignal.set(true);
    return this.http
      .post<LoginResponse>(API_PATHS.authRegister, payload)
      .pipe(
        map((res) => res.session),
        tap((session) => this.setSession(session)),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  logout(): void {
    const token = this.sessionSignal()?.token;
    if (token) {
      this.http
        .post(
          API_PATHS.authLogout,
          {},
          { headers: this.authHeaders(token) },
        )
        .subscribe({ error: () => undefined });
    }
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  refreshMe(): Observable<UserPublic> {
    return this.http
      .get<{ user: UserPublic }>(API_PATHS.authMe, {
        headers: this.authHeaders(),
      })
      .pipe(
        map((res) => res.user),
        tap((user) => {
          const current = this.sessionSignal();
          if (!current) {
            return;
          }
          this.setSession({ ...current, user });
        }),
      );
  }

  hasRole(role: Role): boolean {
    return this.currentUser()?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    const userRole = this.currentUser()?.role;
    return userRole !== undefined && roles.includes(userRole);
  }

  setSession(session: AuthSession | null): void {
    if (session) {
      this.persistSession(session);
    } else {
      this.clearSession();
    }
  }

  restoreSession(): void {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        this.sessionSignal.set(null);
        return;
      }
      const parsed = JSON.parse(raw) as StoredSession;
      if (
        !parsed?.token ||
        !parsed?.user ||
        !parsed?.expiresAt ||
        new Date(parsed.expiresAt).getTime() <= Date.now()
      ) {
        this.clearSession();
        return;
      }
      this.sessionSignal.set({
        token: parsed.token,
        user: parsed.user,
        expiresAt: parsed.expiresAt,
      });
    } catch {
      this.clearSession();
    }
  }

  authHeaders(token?: string): HttpHeaders {
    const value = token ?? this.sessionSignal()?.token;
    return value
      ? new HttpHeaders({ Authorization: `Bearer ${value}` })
      : new HttpHeaders();
  }

  private persistSession(session: AuthSession): void {
    this.sessionSignal.set(session);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  private clearSession(): void {
    this.sessionSignal.set(null);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
}
