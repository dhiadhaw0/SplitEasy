import { Directive, ElementRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { animate } from 'motion';

/**
 * Gives the routed content a subtle fade + rise on every navigation (tab switch, group
 * change, ...), instead of the default hard swap. Put on the element wrapping <router-outlet>.
 */
@Directive({
  selector: '[appRouteFade]',
  standalone: true
})
export class RouteFadeDirective {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
          return;
        }
        animate(this.el.nativeElement, { opacity: [0, 1], y: [6, 0] }, { duration: 0.28, ease: 'easeOut' });
      });
  }
}
