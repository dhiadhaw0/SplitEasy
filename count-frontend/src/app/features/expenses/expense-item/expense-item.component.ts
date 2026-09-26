import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Expense } from '../../../core/models/expense.model';
import { Currency } from '../../../core/models/enums';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { CategoryIconPipe } from '../../../shared/pipes/category-icon.pipe';

@Component({
  selector: 'app-expense-item',
  standalone: true,
  imports: [MatIconModule, MoneyDisplayComponent, CategoryIconPipe],
  templateUrl: './expense-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseItemComponent {
  readonly expense = input.required<Expense>();
  readonly currency = input<Currency>('EUR');
  /** The signed-in user's own participant id in this group, to compute "you owe / you're owed". */
  readonly currentParticipantId = input<number | null>(null);

  protected readonly isTransfer = computed(() => this.expense().type === 'TRANSFER');

  protected readonly transferBeneficiaryName = computed(() => this.expense().shares[0]?.participantName ?? '');

  /** Positive: the current user is owed this much for this expense. Negative: they owe it. Null: not involved. */
  protected readonly myNetAmount = computed<number | null>(() => {
    const participantId = this.currentParticipantId();
    if (participantId == null || this.isTransfer()) {
      return null;
    }
    const expense = this.expense();
    const paid = expense.paidBy.id === participantId ? expense.amount : 0;
    const myShare = expense.shares.find(share => share.participantId === participantId)?.amount ?? 0;
    const net = paid - myShare;
    return Math.abs(net) < 0.005 ? null : Math.round(net * 100) / 100;
  });

  protected readonly myNetAmountAbs = computed(() => {
    const net = this.myNetAmount();
    return net === null ? 0 : Math.abs(net);
  });
}
