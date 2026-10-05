import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnimateInDirective } from '../../shared/directives/animate-in.directive';

/**
 * The native app's entry screen (see nativeEntryGuard) — a compact welcome/auth gate, not the
 * full scrolling marketing page. Real mobile apps (Tricount, Splitwise, ...) open straight to
 * something like this rather than a desktop-oriented landing page crammed into a phone screen.
 */
@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, AnimateInDirective],
  templateUrl: './welcome.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeComponent {}
