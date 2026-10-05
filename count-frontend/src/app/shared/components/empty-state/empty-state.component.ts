import { ChangeDetectionStrategy, Component, afterNextRender, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import confetti from 'canvas-confetti';
import { AnimateInDirective } from '../../directives/animate-in.directive';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, AnimateInDirective],
  templateUrl: './empty-state.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  readonly icon = input<string>('inbox');
  readonly title = input.required<string>();
  readonly message = input<string>('');
  readonly actionLabel = input<string>();

  readonly action = output<void>();

  constructor() {
    // A little reward for genuinely happy states (e.g. "everyone is settled up 🎉") — never
    // for routine empty lists. Skipped under prefers-reduced-motion, like every other animation.
    afterNextRender(() => {
      if (this.icon() !== 'celebration') {
        return;
      }
      const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        return;
      }
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 32,
        origin: { y: 0.7 },
        colors: ['#0f5e5c', '#7fd1b9', '#f6c945', '#f2767a', '#22a884']
      });
    });
  }
}
