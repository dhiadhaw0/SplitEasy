import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

const ICONS = ['payments', 'group', 'lock', 'currency_exchange', 'swap_horiz'];
const ACCENTS = ['var(--se-gradient-brand)', 'var(--se-gradient-warm)', 'var(--se-gradient-brand)', 'var(--se-gradient-warm)', 'var(--se-gradient-brand)'];

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [MatExpansionModule, MatIconModule, TranslocoPipe, AnimateInDirective],
  templateUrl: './landing-faq.component.html',
  styleUrl: './landing-faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingFaqComponent {
  protected readonly items = [1, 2, 3, 4, 5].map((n, i) => ({ n, icon: ICONS[i], accent: ACCENTS[i] }));
}
