import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

@Component({
  selector: 'app-landing-problem',
  standalone: true,
  imports: [TranslocoPipe, AnimateInDirective],
  templateUrl: './landing-problem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingProblemComponent {
}
