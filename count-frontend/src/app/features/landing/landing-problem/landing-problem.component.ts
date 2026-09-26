import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-landing-problem',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './landing-problem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingProblemComponent {
}
