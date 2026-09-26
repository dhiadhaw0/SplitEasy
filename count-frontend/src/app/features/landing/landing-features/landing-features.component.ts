import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe],
  templateUrl: './landing-features.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingFeaturesComponent {
  protected readonly secondaryFeatures = [
    { icon: 'percent', key: 'features.secondary.splitTypes' },
    { icon: 'person_off', key: 'features.secondary.noAccount' },
    { icon: 'link', key: 'features.secondary.inviteLink' },
    { icon: 'filter_alt', key: 'features.secondary.filters' },
    { icon: 'edit_note', key: 'features.secondary.editDelete' },
    { icon: 'dark_mode', key: 'features.secondary.darkMode' }
  ];
}
