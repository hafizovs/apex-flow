import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { emailValidator } from '../../domain/auth/email.validators';
import {
  confirmPasswordMatch,
  passwordStrengthValidator,
  termsAcceptedValidator,
} from '../../domain/auth/password.validators';
import { AuthService } from '../../services/auth.service';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'afx-register-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  protected readonly errorKey = signal<string | null>(null);
  protected readonly loading = this.auth.isLoading;

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    confirmPassword: ['', [Validators.required, confirmPasswordMatch('password')]],
    acceptTerms: [false, [termsAcceptedValidator()]],
  });

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected isInvalid(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  protected errorFor(name: keyof typeof this.form.controls): string {
    const c = this.form.controls[name];
    if (c.hasError('required') || c.hasError('termsRequired')) {
      if (name === 'acceptTerms') {
        return this.t('auth.validation.terms');
      }
      return this.t('auth.validation.required');
    }
    if (c.hasError('email')) {
      return this.t('auth.validation.email');
    }
    if (c.hasError('minlength') || c.hasError('maxlength')) {
      return this.t('auth.validation.displayName');
    }
    if (c.hasError('passwordStrength')) {
      return this.t('auth.validation.passwordStrength');
    }
    if (c.hasError('passwordMismatch')) {
      return this.t('auth.validation.passwordMismatch');
    }
    return this.t('auth.validation.required');
  }

  protected submit(): void {
    this.errorKey.set(null);
    this.form.markAllAsTouched();
    this.form.controls.confirmPassword.updateValueAndValidity();
    if (this.form.invalid) {
      return;
    }
    const value = this.form.getRawValue();
    this.auth.register(value).subscribe({
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 409) {
          this.errorKey.set('auth.error.emailTaken');
          return;
        }
        this.errorKey.set('auth.error.generic');
      },
    });
  }
}
