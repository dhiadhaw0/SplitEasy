import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { AuthService } from '../../../core/services/auth.service';
import { BiometricService } from '../../../core/services/biometric.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

const BIOMETRIC_DECLINED_KEY = 'biometric_prompt_declined';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    AnimateInDirective
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly biometricService = inject(BiometricService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected hidePassword = signal(true);
  protected readonly biometricsAvailable = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    afterNextRender(() => {
      this.checkBiometrics();
    });
  }

  private async checkBiometrics(): Promise<void> {
    const [available, saved] = await Promise.all([
      this.biometricService.isAvailable(),
      this.biometricService.hasStoredCredentials()
    ]);
    this.biometricsAvailable.set(available && saved);
  }

  protected async unlockWithBiometrics(): Promise<void> {
    this.errorMessage.set(null);
    const credentials = await this.biometricService.getCredentials();
    if (!credentials) {
      return; // user cancelled the prompt, or it failed — no need to show an error for that
    }

    this.loading.set(true);
    this.authService.login({ email: credentials.username, password: credentials.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.navigateAfterLogin(),
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Session biométrique expirée. Reconnectez-vous avec votre mot de passe.');
        }
      });
  }

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.maybeOfferBiometrics(email, password),
        error: (error: HttpErrorResponse) => {
          this.loading.set(false);
          this.errorMessage.set(
            error.status === 401 ? 'Email ou mot de passe incorrect.' : 'Une erreur est survenue. Veuillez réessayer.'
          );
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.hidePassword.update(hidden => !hidden);
  }

  /** After a successful manual login on native, offer to enable biometric unlock — once. */
  private async maybeOfferBiometrics(email: string, password: string): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      this.navigateAfterLogin();
      return;
    }

    const [available, alreadySaved, declined] = await Promise.all([
      this.biometricService.isAvailable(),
      this.biometricService.hasStoredCredentials(),
      Preferences.get({ key: BIOMETRIC_DECLINED_KEY })
    ]);

    if (!available || alreadySaved || declined.value === 'true') {
      this.navigateAfterLogin();
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '380px',
      data: {
        title: 'Activer le déverrouillage biométrique ?',
        message: 'Connectez-vous plus rapidement la prochaine fois avec votre empreinte ou votre visage.',
        confirmLabel: 'Activer'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async result => {
        if (result?.confirmed) {
          await this.biometricService.saveCredentials(email, password);
        } else {
          await Preferences.set({ key: BIOMETRIC_DECLINED_KEY, value: 'true' });
        }
        this.navigateAfterLogin();
      });
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/groups';
    this.router.navigateByUrl(returnUrl);
  }
}
