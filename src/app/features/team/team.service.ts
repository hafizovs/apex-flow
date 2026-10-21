import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, Observable, tap, throwError } from 'rxjs';
import { API_PATHS } from '../../core/constants/api.constants';
import type {
  CreateUserInput,
  PaginatedResult,
  TeamQuery,
  UpdateUserInput,
  UserPublic,
} from '../../core/models/app.types';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);

  private readonly loadingSignal = signal(false);
  private readonly assigneesSignal = signal<UserPublic[]>([]);

  readonly isLoading = this.loadingSignal.asReadonly();
  readonly assignees = this.assigneesSignal.asReadonly();

  loadUsers(query: TeamQuery): Observable<PaginatedResult<UserPublic>> {
    this.loadingSignal.set(true);
    const params = new HttpParams()
      .set('page', String(query.page))
      .set('pageSize', String(query.pageSize))
      .set('search', query.search)
      .set('role', query.roleFilter)
      .set('sortBy', query.sortBy)
      .set('sortDir', query.sortDirection);

    return this.http
      .get<PaginatedResult<UserPublic>>(API_PATHS.users, { params })
      .pipe(
        catchError((err) => throwError(() => err)),
        finalize(() => this.loadingSignal.set(false)),
      );
  }

  createUser(input: CreateUserInput): Observable<UserPublic> {
    this.loadingSignal.set(true);
    return this.http.post<UserPublic>(API_PATHS.users, input).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  updateUser(id: string, patch: UpdateUserInput): Observable<UserPublic> {
    this.loadingSignal.set(true);
    return this.http.patch<UserPublic>(API_PATHS.userById(id), patch).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  getAssigneeOptions(): Observable<UserPublic[]> {
    return this.http.get<UserPublic[]>(API_PATHS.usersAssignees).pipe(
      tap((users) => this.assigneesSignal.set(users)),
      catchError((err) => throwError(() => err)),
    );
  }

  resetDemo(): Observable<{ ok: true }> {
    this.loadingSignal.set(true);
    return this.http.post<{ ok: true }>(API_PATHS.demoReset, {}).pipe(
      catchError((err) => throwError(() => err)),
      finalize(() => this.loadingSignal.set(false)),
    );
  }
}
