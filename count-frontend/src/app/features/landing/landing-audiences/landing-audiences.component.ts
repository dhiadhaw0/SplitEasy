import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';

interface Audience {
  key: string;
  icon: string;
  balanceName: string;
  balanceAmount: number;
  amounts: [number, number, number];
}

@Component({
  selector: 'app-landing-audiences',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe, MoneyDisplayComponent],
  templateUrl: './landing-audiences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingAudiencesComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly currentLang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });

  protected readonly audiences: Audience[] = [
    { key: 'travel', icon: 'flight', balanceName: 'Sara', balanceAmount: 45, amounts: [320, 65, 180] },
    { key: 'roommates', icon: 'home', balanceName: 'Ali', balanceAmount: -120, amounts: [900, 140, 35] },
    { key: 'couple', icon: 'favorite', balanceName: 'Lina', balanceAmount: 30, amounts: [210, 90, 540] },
    { key: 'event', icon: 'celebration', balanceName: 'Omar', balanceAmount: -85, amounts: [60, 150, 400] }
  ];

  protected readonly selectedKey = signal(this.audiences[0].key);

  protected readonly selected = computed(
    () => this.audiences.find(a => a.key === this.selectedKey()) ?? this.audiences[0]
  );

  protected readonly selectedItemLabels = computed(() => {
    this.currentLang(); // recompute whenever the active language changes
    const example = this.transloco.translate(`audiences.${this.selectedKey()}.example`);
    return example.split(',').map((label: string) => label.trim());
  });

  protected select(key: string): void {
    this.selectedKey.set(key);
  }
}
