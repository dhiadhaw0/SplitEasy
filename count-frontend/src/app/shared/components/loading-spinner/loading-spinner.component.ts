import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AnimateInDirective } from '../../directives/animate-in.directive';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [AnimateInDirective],
  templateUrl: './loading-spinner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingSpinnerComponent {
  readonly label = input<string>('Chargement…');
}
