import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ParticipantService } from '../../../core/services/participant.service';
import { Participant } from '../../../core/models/participant.model';

export interface ParticipantFormDialogData {
  mode: 'add' | 'rename';
  groupId: number;
  participant?: Participant;
}

export interface ParticipantFormDialogResult {
  participant: Participant;
}

@Component({
  selector: 'app-participant-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  templateUrl: './participant-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly participantService = inject(ParticipantService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<ParticipantFormDialogComponent, ParticipantFormDialogResult | undefined>);
  protected readonly data = inject<ParticipantFormDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.participant?.name ?? '', [Validators.required, Validators.maxLength(50)]]
  });

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const name = this.form.getRawValue().name;

    const call$ =
      this.data.mode === 'add'
        ? this.participantService.add(this.data.groupId, name)
        : this.participantService.rename(this.data.groupId, this.data.participant!.id, name);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: participant => this.dialogRef.close({ participant }),
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(error?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
