import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import gsap from 'gsap';
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

  private readonly destroyRef = inject(DestroyRef);
  private readonly reduceMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  private tween?: gsap.core.Tween;
  private animatedOnce = false;

  /** Ticks up/down from the previous value with GSAP instead of snapping, so every balance,
   * total and share across the app feels alive rather than a static re-render. */
  protected readonly displayedAmount = signal(0);

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

  constructor() {
    effect(() => {
      const target = this.amount();
      if (this.reduceMotion) {
        this.displayedAmount.set(target);
        return;
      }
      const from = this.animatedOnce ? this.displayedAmount() : 0;
      this.animatedOnce = true;
      this.tween?.kill();
      const proxy = { value: from };
      this.tween = gsap.to(proxy, {
        value: target,
        duration: 0.7,
        ease: 'power2.out',
        onUpdate: () => this.displayedAmount.set(proxy.value)
      });
    });
    this.destroyRef.onDestroy(() => this.tween?.kill());
  }
}
