import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { PASSWORD_SALT } from '../../core/constants/auth.constants';

export function hashPassword(plain: string): string {
  return btoa(`${PASSWORD_SALT}:${plain}`);
}

export function verifyPassword(plain: string, hash: string): boolean {
  return hashPassword(plain) === hash;
}

export function passwordStrengthValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const password = String(value);
    const errors: ValidationErrors = {};

    if (password.length < 8) {
      errors['minLength'] = { requiredLength: 8, actualLength: password.length };
    }
    if (!/[A-Z]/.test(password)) {
      errors['uppercase'] = true;
    }
    if (!/[a-z]/.test(password)) {
      errors['lowercase'] = true;
    }
    if (!/\d/.test(password)) {
      errors['digit'] = true;
    }

    return Object.keys(errors).length > 0 ? { passwordStrength: errors } : null;
  };
}

export function confirmPasswordMatch(passwordControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) {
      return null;
    }
    const passwordControl = parent.get(passwordControlName);
    if (!passwordControl) {
      return null;
    }
    const password = passwordControl.value;
    const confirm = control.value;
    if (confirm === null || confirm === undefined || confirm === '') {
      return null;
    }
    return password === confirm ? null : { passwordMismatch: true };
  };
}

export function termsAcceptedValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return control.value === true ? null : { termsRequired: true };
  };
}
