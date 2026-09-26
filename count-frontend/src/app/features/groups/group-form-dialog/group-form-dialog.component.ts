import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService } from '../../../core/services/group.service';
import { CURRENCIES, Currency } from '../../../core/models/enums';
import { GroupDetail } from '../../../core/models/group.model';

export interface GroupFormDialogData {
  mode: 'create' | 'edit';
  group?: GroupDetail;
}

export interface GroupFormDialogResult {
  group: GroupDetail;
}

@Component({
  selector: 'app-group-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './group-form-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<GroupFormDialogComponent, GroupFormDialogResult | undefined>);
  protected readonly data = inject<GroupFormDialogData>(MAT_DIALOG_DATA);

  protected readonly currencies = CURRENCIES;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    name: [this.data.group?.name ?? '', [Validators.required, Validators.maxLength(80)]],
    description: [this.data.group?.description ?? '', [Validators.maxLength(255)]],
    currency: [(this.data.group?.currency ?? 'EUR') as Currency, [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const request = this.form.getRawValue();

    const call$ =
      this.data.mode === 'create'
        ? this.groupService.create(request)
        : this.groupService.update(this.data.group!.id, request);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: group => this.dialogRef.close({ group }),
      error: error => {
        this.loading.set(false);
        this.errorMessage.set(error?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      }
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
