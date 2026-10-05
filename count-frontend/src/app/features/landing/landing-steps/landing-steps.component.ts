import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

@Component({
  selector: 'app-landing-steps',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe, AnimateInDirective],
  templateUrl: './landing-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingStepsComponent implements AfterViewInit {
  protected readonly steps = [
    { number: 1, titleKey: 'steps.step1Title', textKey: 'steps.step1Text', icon: 'group_add', bg: 'var(--se-gradient-brand)' },
    { number: 2, titleKey: 'steps.step2Title', textKey: 'steps.step2Text', icon: 'receipt_long', bg: 'linear-gradient(135deg, #8b5cf6, #c4b5fd)' },
    { number: 3, titleKey: 'steps.step3Title', textKey: 'steps.step3Text', icon: 'handshake', bg: 'var(--se-gradient-warm)' }
  ];

  private readonly track = viewChild<ElementRef<HTMLElement>>('track');
  private readonly lineFill = viewChild<ElementRef<HTMLElement>>('lineFill');

  async ngAfterViewInit(): Promise<void> {
    const track = this.track()?.nativeElement;
    const lineFill = this.lineFill()?.nativeElement;
    if (!track || !lineFill) {
      return;
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      lineFill.style.transform = 'scaleY(1)';
      return;
    }

    // Loaded here, not app-wide: ScrollTrigger only ever ships to visitors who reach this one
    // landing-page section, same reasoning as the lazy Swiper import elsewhere on this page.
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(
      lineFill,
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: track,
          start: 'top 75%',
          end: 'bottom 65%',
          scrub: 0.4
        }
      }
    );
  }
}
