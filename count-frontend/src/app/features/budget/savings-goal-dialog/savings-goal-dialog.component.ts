import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { SavingsGoal, SavingsGoalRequest } from '../../../core/models/savings-goal.model';

export interface SavingsGoalDialogData {
  groupId: number;
  goal?: SavingsGoal;
}

@Component({
  selector: 'app-savings-goal-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './savings-goal-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SavingsGoalDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly savingsGoalService = inject(SavingsGoalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<SavingsGoalDialogComponent, SavingsGoal | undefined>);
  protected readonly data = inject<SavingsGoalDialogData>(MAT_DIALOG_DATA);

  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control(this.data.goal?.name ?? '', [Validators.required, Validators.maxLength(80)]),
    targetAmount: this.fb.control<number | null>(this.data.goal?.targetAmount ?? null, [Validators.required, Validators.min(0.01)]),
    deadline: this.fb.control<Date | null>(this.data.goal?.deadline ? new Date(this.data.goal.deadline) : null)
  });

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const request: SavingsGoalRequest = {
      name: value.name,
      targetAmount: value.targetAmount!,
      deadline: value.deadline ? this.toIsoDate(value.deadline) : null
    };

    const call$ = this.data.goal
      ? this.savingsGoalService.update(this.data.groupId, this.data.goal.id, request, true)
      : this.savingsGoalService.create(this.data.groupId, request, true);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: goal => this.dialogRef.close(goal),
      error: error => {
        this.saving.set(false);
        this.errorMessage.set(error?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
