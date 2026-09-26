import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Currency } from '../../../core/models/enums';
import { MoneyPipe } from '../../pipes/money.pipe';

@Component({
  selector: 'app-money-display',
  standalone: true,
  imports: [MoneyPipe],
  templateUrl: './money-display.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MoneyDisplayComponent {
  readonly amount = input.required<number>();
  readonly currency = input<Currency>('EUR');
  /** When true, the amount is colored green/red/grey depending on its sign. */
  readonly colored = input<boolean>(false);

  protected readonly colorClass = computed(() => {
    if (!this.colored()) {
      return '';
    }
    if (this.amount() > 0) {
      return 'se-positive';
    }
    if (this.amount() < 0) {
      return 'se-negative';
    }
    return 'se-neutral';
  });
}
