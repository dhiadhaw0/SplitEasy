import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BudgetService } from '../../../core/services/budget.service';
import { BUDGET_PERIOD_LABELS, Budget, BudgetPeriod, BudgetRequest } from '../../../core/models/budget.model';
import { CATEGORIES, CATEGORY_LABELS, Category } from '../../../core/models/enums';

export interface BudgetFormDialogData {
  groupId: number;
  budget?: Budget;
}

@Component({
  selector: 'app-budget-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './budget-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly budgetService = inject(BudgetService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<BudgetFormDialogComponent, Budget | undefined>);
  protected readonly data = inject<BudgetFormDialogData>(MAT_DIALOG_DATA);

  protected readonly categories = CATEGORIES;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly periods: BudgetPeriod[] = ['MONTHLY', 'YEARLY'];
  protected readonly periodLabels = BUDGET_PERIOD_LABELS;
  protected readonly saving = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.group({
    category: this.fb.control<Category | null>(this.data.budget?.category ?? null),
    amountLimit: this.fb.control<number | null>(this.data.budget?.amountLimit ?? null, [Validators.required, Validators.min(0.01)]),
    period: this.fb.nonNullable.control<BudgetPeriod>(this.data.budget?.period ?? 'MONTHLY', [Validators.required])
  });

  protected submit(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const request: BudgetRequest = {
      category: value.category ?? null,
      amountLimit: value.amountLimit!,
      period: value.period
    };

    const call$ = this.data.budget
      ? this.budgetService.update(this.data.groupId, this.data.budget.id, request, true)
      : this.budgetService.create(this.data.groupId, request, true);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: budget => this.dialogRef.close(budget),
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
