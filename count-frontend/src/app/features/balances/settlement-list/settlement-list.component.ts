import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { BalanceService } from '../../../core/services/balance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Settlement } from '../../../core/models/balance.model';
import { Currency } from '../../../core/models/enums';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const ACCENT_BACKGROUNDS = ['var(--se-teal-bg)', 'var(--se-accent-bg)', 'var(--se-color-neutral-bg)'];

@Component({
  selector: 'app-settlement-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MoneyDisplayComponent, EmptyStateComponent, ParticipantAvatarComponent, AnimateInDirective],
  templateUrl: './settlement-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettlementListComponent {
  private readonly balanceService = inject(BalanceService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly settlements = input.required<Settlement[]>();
  readonly groupId = input.required<number>();
  readonly currency = input<Currency>('EUR');

  /** Emitted once a settlement has been recorded, so the parent can reload balances + suggestions. */
  readonly recorded = output<void>();

  protected accentBg(index: number): string {
    return ACCENT_BACKGROUNDS[index % ACCENT_BACKGROUNDS.length];
  }

  protected markAsReimbursed(settlement: Settlement): void {
    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Marquer comme remboursé',
        message: `${settlement.fromName} rembourse ${settlement.toName}.`,
        confirmLabel: 'Confirmer',
        numberField: { label: 'Montant', initialValue: settlement.amount, min: 0.01, step: 0.01 }
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result?.confirmed) {
          return;
        }
        this.balanceService.recordSettlement(this.groupId(), {
          fromParticipantId: settlement.fromParticipantId,
          toParticipantId: settlement.toParticipantId,
          amount: result.value ?? settlement.amount,
          date: todayDateOnlyString()
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.notification.success('Remboursement enregistré.');
            this.recorded.emit();
          }
        });
      });
  }
}

function todayDateOnlyString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
