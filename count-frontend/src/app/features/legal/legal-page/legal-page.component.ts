import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

export type LegalPageType = 'privacy' | 'terms';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslocoPipe],
  templateUrl: './legal-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegalPageComponent {
  readonly type = input.required<LegalPageType>();

  protected readonly icon = computed(() => (this.type() === 'privacy' ? 'shield' : 'gavel'));
  protected readonly prefix = computed(() => `legal.${this.type()}`);
}
