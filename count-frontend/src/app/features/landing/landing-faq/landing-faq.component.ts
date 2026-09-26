import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-landing-faq',
  standalone: true,
  imports: [MatExpansionModule, TranslocoPipe],
  templateUrl: './landing-faq.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingFaqComponent {
  protected readonly items = [1, 2, 3, 4, 5];
}
