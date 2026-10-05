import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-landing-final-cta',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslocoPipe],
  templateUrl: './landing-final-cta.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingFinalCtaComponent {
  protected readonly authService = inject(AuthService);
}
