import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Role } from '../models/app.types';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = (route.data['roles'] as Role[]) ?? [];
  if (auth.hasAnyRole(allowed)) {
    return true;
  }
  return router.createUrlTree(['/board']);
};
