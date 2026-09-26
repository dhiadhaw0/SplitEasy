import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-landing-settle',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './landing-settle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingSettleComponent {
}
