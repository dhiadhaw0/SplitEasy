import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-landing-steps',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './landing-steps.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingStepsComponent {
  protected readonly steps = [
    { number: 1, titleKey: 'steps.step1Title', textKey: 'steps.step1Text', icon: 'group_add' },
    { number: 2, titleKey: 'steps.step2Title', textKey: 'steps.step2Text', icon: 'receipt_long' },
    { number: 3, titleKey: 'steps.step3Title', textKey: 'steps.step3Text', icon: 'handshake' }
  ];
}
