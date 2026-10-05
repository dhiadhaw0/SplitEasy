import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { animate, stagger } from 'motion';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslocoPipe, ParticipantAvatarComponent],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingHeroComponent {
  protected readonly authService = inject(AuthService);

  private readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  protected readonly demoLineKeys = ['hero.demoLine1', 'hero.demoLine2', 'hero.demoLine3'];

  protected readonly balanceRows = [
    { name: 'Sara', widthPercent: 42, positive: true },
    { name: 'Ali', widthPercent: 32, positive: false },
    { name: 'Omar', widthPercent: 58, positive: true },
    { name: 'Lina', widthPercent: 54, positive: false }
  ];

  constructor() {
    afterNextRender(() => this.playIntroAnimation());
  }

  protected scrollToSteps(event: Event): void {
    event.preventDefault();
    const target = document.getElementById('steps');
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  /**
   * The page's one and only animated moment: the expense lines appear one after another,
   * then the balance bars grow outward from the center. Total duration stays under 1.5s.
   * Skipped entirely when the user prefers reduced motion.
   */
  private playIntroAnimation(): void {
    const root = this.card().nativeElement;
    const lines = root.querySelectorAll<HTMLElement>('.se-hero-demo-line');
    const bars = root.querySelectorAll<HTMLElement>('.se-hero-demo-bar');

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      lines.forEach(el => (el.style.opacity = '1'));
      bars.forEach(el => (el.style.transform = 'scaleX(1)'));
      return;
    }

    const linesAnimation = animate(
      lines,
      { opacity: [0, 1], x: [-8, 0] },
      { duration: 0.3, delay: stagger(0.15) }
    );

    linesAnimation.then(() => {
      animate(bars, { scaleX: [0, 1] }, { duration: 0.45, delay: stagger(0.08) });
    });
  }
}
