import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { emailValidator } from '../../../../domain/auth/email.validators';
import { AuthService } from '../../auth.service';
import { I18nService } from '../../../../core/i18n.service';

@Component({
  selector: 'afx-login-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  protected readonly i18n = inject(I18nService);

  protected readonly errorKey = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    password: ['', [Validators.required]],
  });

  protected readonly demoAccounts = [
    { role: 'Admin', email: 'admin@apexflow.dev', password: 'Admin123!' },
    { role: 'Manager', email: 'manager@apexflow.dev', password: 'Manager123!' },
    { role: 'Developer', email: 'dev@apexflow.dev', password: 'Dev12345!' },
  ] as const;

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      return;
    }
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected isInvalid(controlName: 'email' | 'password'): boolean {
    const c = this.form.controls[controlName];
    return c.invalid && (c.dirty || c.touched);
  }

  protected submit(): void {
    this.errorKey.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    this.auth.login(this.form.getRawValue()).subscribe({
      error: (err: unknown) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.errorKey.set('auth.error.invalidCredentials');
            return;
          }
          if (err.status === 403) {
            this.errorKey.set('auth.error.blocked');
            return;
          }
        }
        this.errorKey.set('auth.error.network');
      },
    });
  }

  protected fillDemo(email: string, password: string): void {
    this.form.setValue({ email, password });
  }

  protected readonly loading = this.auth.isLoading;
}
