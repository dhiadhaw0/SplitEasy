import { Directive, ElementRef, Renderer2, afterNextRender, inject, input } from '@angular/core';
import { animate } from 'motion';

/**
 * Fades + slides an element in on creation. Meant for list/grid items rendered by @for:
 * bind the loop's $index to stagger the entrance (`[appAnimateIn]="$index"`).
 * Respects prefers-reduced-motion.
 */
@Directive({
  selector: '[appAnimateIn]',
  standalone: true
})
export class AnimateInDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);

  /** Stagger index (typically the @for loop's $index). */
  readonly appAnimateIn = input<number>(0);

  constructor() {
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const element = this.el.nativeElement;
    this.renderer.setStyle(element, 'opacity', '0');

    afterNextRender(() => {
      const delay = Math.min(this.appAnimateIn() * 0.035, 0.35);
      animate(
        element,
        { opacity: [0, 1], y: [10, 0] },
        { duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }
      );
    });
  }
}
