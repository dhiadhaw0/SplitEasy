import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: 'primary' | 'warn';
  /** Header icon; defaults to a warning icon for `color: 'warn'` and a question mark otherwise. */
  icon?: string;
  /** If set, the confirm button stays disabled until the user types this exact text. */
  requireTypedText?: string;
  /** If set, shows an editable number field seeded with this value; its value is returned on confirm. */
  numberField?: { label: string; initialValue: number; min?: number; step?: number };
}

export interface ConfirmDialogResult {
  confirmed: true;
  value?: number;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule],
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent, ConfirmDialogResult | undefined>);
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

  protected readonly typedText = signal('');
  protected readonly numberValue = signal(this.data.numberField?.initialValue ?? 0);
  protected readonly isWarn = this.data.color === 'warn';
  protected readonly icon = this.data.icon ?? (this.isWarn ? 'warning' : 'help_outline');

  protected readonly canConfirm = computed(() => {
    if (this.data.requireTypedText && this.typedText() !== this.data.requireTypedText) {
      return false;
    }
    if (this.data.numberField && !(this.numberValue() > 0)) {
      return false;
    }
    return true;
  });

  protected onTypedTextChange(value: string): void {
    this.typedText.set(value);
  }

  protected onNumberValueChange(value: number): void {
    this.numberValue.set(value);
  }

  protected confirm(): void {
    if (!this.canConfirm()) {
      return;
    }
    this.dialogRef.close({
      confirmed: true,
      value: this.data.numberField ? this.numberValue() : undefined
    });
  }

  protected cancel(): void {
    this.dialogRef.close(undefined);
  }
}
