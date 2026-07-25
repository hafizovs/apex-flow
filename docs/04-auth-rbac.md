# 04 — Auth & RBAC (Mock REST + Guards)

Реализуй авторизацию и разграничение прав **точно** по этому документу. Не заменяй guards на `*ngIf` в шаблонах. Не пропускай interceptor delay и Bearer header.

Главные файлы: `auth.service.ts`, `mock-api.interceptor.ts`, `mock-db.ts`, `guards/*`, `pages/login/*`, `pages/register/*`.

---

## 4.1 Файлы

| Файл | Назначение |
|------|------------|
| `services/auth.service.ts` | Signals session, login/register/logout, persist |
| `interceptors/mock-api.interceptor.ts` | REST router, delay 800ms, Bearer |
| `interceptors/mock-db.ts` | In-memory users + tasks, seed, hash passwords |
| `domain/auth/token.helpers.ts` | generateToken, parseToken (mock) |
| `domain/auth/email.validators.ts` | email format |
| `domain/auth/password.validators.ts` | strength rules |
| `guards/auth.guard.ts` | CanActivateFn authenticated |
| `guards/role.guard.ts` | CanActivateFn role check |
| `pages/login/login.page.ts` | Login form |
| `pages/register/register.page.ts` | Register form |
| `core/constants/auth.constants.ts` | SESSION_STORAGE_KEY, token prefix |

---

## 4.2 AuthService — public API

```ts
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

  login(credentials: LoginCredentials): Observable<AuthSession> { /* POST /api/auth/login */ }
  register(payload: RegisterPayload): Observable<AuthSession> { /* POST /api/auth/register */ }
  logout(): void { /* clear session, navigate /login */ }
  refreshMe(): Observable<UserPublic> { /* GET /api/auth/me */ }

  hasRole(role: Role): boolean;
  hasAnyRole(roles: Role[]): boolean;

  restoreSession(): void;
  private persistSession(session: AuthSession): void;
  private clearSession(): void;
}
```

### restoreSession / persistSession

1. `restoreSession()` — читает `localStorage.getItem(SESSION_STORAGE_KEY)`, JSON.parse → validate shape → if `expiresAt > now` set sessionSignal, else clear.
2. `persistSession` — `localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token, user, expiresAt }))`.
3. `clearSession` — remove item + `sessionSignal.set(null)`.

### login flow

1. `loadingSignal.set(true)`.
2. `http.post<LoginResponse>('/api/auth/login', credentials)`.
3. On success: `sessionSignal.set(session)`, `persistSession`, `router.navigate(['/board'])`.
4. On error: surface message in form (401 invalid credentials, 403 blocked).
5. `loadingSignal.set(false)` in finalize.

---

## 4.3 Password hashing (mock)

**Канон v1:** простой deterministic hash для demo (не bcrypt в браузере):

```ts
export function hashPassword(plain: string): string {
  /* e.g. base64 of `${SALT}:${plain}` — SALT from auth.constants */
}
export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}
```

Seed users в Appendix A хранят precomputed `passwordHash`. Register/Team create используют `hashPassword`.

---

## 4.4 Validators

### Email (`domain/auth/email.validators.ts`)

```ts
export function isValidEmail(value: string): boolean {
  /* RFC-lite: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ */
}
export function emailValidator(): ValidatorFn { /* Angular validator */ }
```

### Password (`domain/auth/password.validators.ts`)

Rules for register / team add:
- min length 8
- at least 1 uppercase
- at least 1 lowercase
- at least 1 digit

```ts
export function passwordStrengthValidator(): ValidatorFn;
export function confirmPasswordMatch(passwordControlName: string): ValidatorFn;
export function termsAcceptedValidator(): ValidatorFn; // register only
```

Login form: required email + password only.

---

## 4.5 Login page

**Route:** `/login`, lazy `LoginPage`, **без** AppShell.

Layout: split-screen — left marketing panel (gradient + product tagline), right form card.

Form fields:
- email (type email, autocomplete username)
- password (type password, autocomplete current-password)
- submit button with loading state
- link to `/register`
- demo credentials hint (readonly text from Appendix A)

On submit: mark all touched, if invalid stop; else `authService.login()`.

Errors:
- 401 → `auth.error.invalidCredentials`
- 403 → `auth.error.blocked`
- network → `auth.error.network`

Redirect if already authenticated: `authGuard` inverse — on init if `isAuthenticated()` → `/board`.

---

## 4.6 Register page

**Route:** `/register`, lazy `RegisterPage`.

Fields:
- email
- displayName (min 2, max 60)
- password
- confirmPassword
- acceptTerms checkbox (required true)

On success: auto-login session → `/board`.

Errors:
- 409 duplicate email → `auth.error.emailTaken`

---

## 4.7 Functional guards

### authGuard

```ts
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
```

### roleGuard

```ts
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as Role[]) ?? [];
  if (auth.hasAnyRole(allowed)) return true;
  return router.createUrlTree(['/board']);
};
```

---

## 4.8 mock-api.interceptor.ts

```ts
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api/')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const delayMs = NETWORK_DELAY_MS; // 800

  return of(null).pipe(
    delay(delayMs),
    switchMap(() => {
      const token = req.headers.get('Authorization')?.replace('Bearer ', '');
      const handler = resolveHandler(req.method, req.url);

      if (handler.requiresAuth && !token) {
        return throwError(() => new HttpErrorResponse({ status: 401, ... }));
      }

      if (handler.requiresAuth) {
        const user = mockDb.findUserByToken(token);
        if (!user) return throwError(() => new HttpErrorResponse({ status: 401, ... }));
        if (user.isBlocked) return throwError(() => new HttpErrorResponse({ status: 403, ... }));
        if (handler.requiredRoles && !handler.requiredRoles.includes(user.role)) {
          return throwError(() => new HttpErrorResponse({ status: 403, ... }));
        }
      }

      const body = req.body;
      const result = handler.execute({ req, body, user: token ? mockDb.findUserByToken(token) : null });
      return of(new HttpResponse({ status: result.status, body: result.body }));
    }),
  );
};
```

### Bearer injection (client-side)

**Канон:** AuthService HTTP calls используют `HttpHeaders` с Bearer. Interceptor **также** может clone request:

```ts
const cloned = session
  ? req.clone({ setHeaders: { Authorization: `Bearer ${session.token}` } })
  : req;
```

Достаточно одного места — но token **обязан** присутствовать на protected endpoints.

### NETWORK_DELAY_MS

Константа `800` из `core/constants/api.constants.ts`. Каждый `/api/*` request ждёт delay **перед** handler logic.

---

## 4.9 mock-db.ts

```ts
interface MockDatabase {
  users: User[];
  tasks: Task[];
  sessions: Map<string, string>; // token → userId
}

export const mockDb = createSeedDatabase(); // Appendix A

export function resetMockDb(): void;
export function findUserByToken(token: string): User | undefined;
export function findUserByEmail(email: string): User | undefined;
```

Mutations:
- login → create token, map to userId
- register → push user, hash password
- users CRUD → admin only via handler
- tasks CRUD → authenticated users

**Seed on bootstrap:** load Appendix A users (≥3) and tasks (≥12).

---

## 4.10 REST handlers (канон)

### POST `/api/auth/login`

Body: `{ email, password }`
- find user by email (case-insensitive)
- verify password
- if blocked → 403
- else create session `{ token, user: toPublic(user), expiresAt: now+7d }`

### POST `/api/auth/register`

Body: RegisterPayload fields (server ignores confirmPassword)
- duplicate email → 409
- create developer user
- return session

### GET `/api/auth/me`

Requires Bearer → return `{ user: UserPublic }`

### GET `/api/users?page=&pageSize=&search=&role=&sortBy=&sortDir=`

Admin only → `PaginatedResult<UserPublic>`

### POST `/api/users`

Admin only → CreateUserInput → UserPublic

### PATCH `/api/users/:id`

Admin only → UpdateUserInput; cannot block self admin seed

### GET/POST/PATCH/DELETE `/api/tasks`

See document 05; auth required; delete RBAC per product vision §1.5.

### POST `/api/demo/reset`

Admin only → `resetMockDb()` → `{ ok: true }`

---

## 4.11 RBAC matrix (routes + API)

| Resource | admin | manager | developer |
|----------|-------|---------|-----------|
| GET tasks | ✓ | ✓ | ✓ |
| POST tasks | ✓ | ✓ | ✓ |
| PATCH tasks | ✓ | ✓ | ✓ |
| DELETE tasks | ✓ | ✓ | own assignee only |
| GET users | ✓ | ✗ | ✗ |
| POST/PATCH users | ✓ | ✗ | ✗ |
| demo reset | ✓ | ✗ | ✗ |

---

## 4.12 Sidebar visibility (UI)

`SidebarComponent` computed `visibleNavItems`:

```ts
readonly navItems = computed(() => {
  const role = auth.currentUser()?.role;
  return ALL_NAV.filter(item => !item.roles || item.roles.includes(role!));
});
```

Do not rely on hiding alone — guards must enforce.

---

## 4.13 Error codes (i18n mapping)

| HTTP | code | i18n key |
|------|------|----------|
| 401 | `UNAUTHORIZED` | `error.unauthorized` |
| 403 | `FORBIDDEN` | `error.forbidden` |
| 404 | `NOT_FOUND` | `error.notFound` |
| 409 | `CONFLICT` | `auth.error.emailTaken` |
| 422 | `VALIDATION` | `error.validation` |

---

## 4.14 Tests (минимум)

`auth.service.spec.ts`:
- restoreSession valid/invalid/expired
- login success updates signal
- logout clears storage
- hasRole / hasAnyRole

`mock-api.interceptor.spec.ts`:
- delay ≥ 800ms (fakeAsync)
- missing token on protected → 401
- admin endpoint as developer → 403

`role.guard.spec.ts`:
- allows admin to /team
- denies developer to /team
