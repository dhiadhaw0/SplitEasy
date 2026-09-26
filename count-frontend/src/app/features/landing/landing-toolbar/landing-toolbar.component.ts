import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import { ThemeToggleComponent } from '../../../shared/components/theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-landing-toolbar',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslocoPipe, LanguageSwitcherComponent, ThemeToggleComponent],
  templateUrl: './landing-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingToolbarComponent {
  protected readonly authService = inject(AuthService);

  protected scrollTo(event: Event, anchorId: string): void {
    event.preventDefault();
    const target = document.getElementById(anchorId);
    if (!target) {
      return;
    }
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }
}
