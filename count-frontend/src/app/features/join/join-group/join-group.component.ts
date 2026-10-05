import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { InvitePreview } from '../../../core/models/group.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

type Choice = 'existing' | 'new';

@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ParticipantAvatarComponent,
    AnimateInDirective
  ],
  templateUrl: './join-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JoinGroupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly inviteCode = input.required<string>();

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly preview = signal<InvitePreview | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    choice: ['new' as Choice, [Validators.required]],
    participantId: [null as number | null],
    newParticipantName: ['', [Validators.maxLength(50)]]
  });

  protected readonly canSubmit = computed(() => {
    const value = this.form.getRawValue();
    if (this.submitting()) {
      return false;
    }
    return value.choice === 'existing' ? value.participantId != null : value.newParticipantName.trim().length > 0;
  });

  constructor() {
    effect(() => {
      const code = this.inviteCode();
      if (code) {
        this.loadPreview(code);
      }
    }, { allowSignalWrites: true });
  }

  private loadPreview(code: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupService.previewInvite(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: preview => {
          this.preview.set(preview);
          this.form.patchValue({ choice: preview.unlinkedParticipants.length > 0 ? 'existing' : 'new' });
          this.loading.set(false);
        },
        error: () => {
          this.error.set("Ce code d'invitation n'est pas valide.");
          this.loading.set(false);
        }
      });
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);
    const value = this.form.getRawValue();

    this.groupService.join({
      inviteCode: this.inviteCode(),
      participantId: value.choice === 'existing' ? value.participantId : null,
      newParticipantName: value.choice === 'new' ? value.newParticipantName.trim() : null
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: group => this.router.navigate(['/groups', group.id]),
        error: (error: HttpErrorResponse) => {
          this.submitting.set(false);
          const previewGroupId = this.preview()?.groupId;
          if (error.status === 409 && previewGroupId != null) {
            this.notification.success('Vous êtes déjà membre de ce groupe.');
            this.router.navigate(['/groups', previewGroupId]);
          }
        }
      });
  }
}
