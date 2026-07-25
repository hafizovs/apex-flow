import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { emailValidator } from '../../../domain/auth/email.validators';
import { passwordStrengthValidator } from '../../../domain/auth/password.validators';
import type { Role, UserPublic } from '../../../models/app.types';
import { I18nService } from '../../../services/i18n.service';
import { TeamService } from '../../../services/team.service';
import { UiStore } from '../../../state/ui.store';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'afx-team-member-modal',
  imports: [ReactiveFormsModule, ModalComponent],
  templateUrl: './team-member-modal.component.html',
  styleUrl: './team-member-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMemberModalComponent {
  readonly mode = input.required<'add' | 'edit'>();
  readonly user = input<UserPublic | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly fb = inject(FormBuilder);
  private readonly team = inject(TeamService);
  private readonly ui = inject(UiStore);
  protected readonly i18n = inject(I18nService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    displayName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    password: ['', [Validators.required, passwordStrengthValidator()]],
    role: ['developer' as Role, Validators.required],
  });

  constructor() {
    effect(() => {
      const mode = this.mode();
      const user = this.user();
      if (mode === 'edit' && user) {
        this.form.reset({
          email: user.email,
          displayName: user.displayName,
          password: 'Placeholder1',
          role: user.role,
        });
        this.form.controls.email.disable();
        this.form.controls.password.clearValidators();
        this.form.controls.password.updateValueAndValidity();
      } else {
        this.form.controls.email.enable();
        this.form.controls.password.setValidators([
          Validators.required,
          passwordStrengthValidator(),
        ]);
        this.form.reset({
          email: '',
          displayName: '',
          password: '',
          role: 'developer',
        });
      }
    });
  }

  protected t(key: string): string {
    return this.i18n.t(key);
  }

  protected title(): string {
    return this.mode() === 'add' ? this.t('team.addMember') : this.t('team.editMember');
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    if (this.mode() === 'add') {
      this.team
        .createUser({
          email: raw.email.trim(),
          displayName: raw.displayName.trim(),
          password: raw.password,
          role: raw.role,
        })
        .subscribe({
          next: () => {
            this.ui.showToast('toast.userCreated');
            this.saved.emit();
          },
          error: () => this.ui.showToast('toast.error.generic'),
        });
      return;
    }
    const user = this.user();
    if (!user) {
      return;
    }
    this.team
      .updateUser(user.id, {
        displayName: raw.displayName.trim(),
        role: raw.role,
      })
      .subscribe({
        next: () => {
          this.ui.showToast('toast.userUpdated');
          this.saved.emit();
        },
        error: () => this.ui.showToast('toast.error.generic'),
      });
  }
}
