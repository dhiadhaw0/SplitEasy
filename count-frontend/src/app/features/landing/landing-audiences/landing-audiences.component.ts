import {
  AfterViewInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import type { SwiperContainer } from 'swiper/element';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

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
  imports: [MatIconModule, TranslocoPipe, MoneyDisplayComponent, AnimateInDirective],
  templateUrl: './landing-audiences.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <swiper-container>/<swiper-slide> are custom elements (registered once in main.ts), not
  // Angular components — this tells the template compiler not to expect metadata for them.
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingAudiencesComponent implements AfterViewInit {
  private readonly transloco = inject(TranslocoService);
  private readonly currentLang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() });
  private readonly swiperRef = viewChild<ElementRef<SwiperContainer>>('swiperEl');

  protected readonly audiences: Audience[] = [
    { key: 'travel', icon: 'flight', balanceName: 'Sara', balanceAmount: 45, amounts: [320, 65, 180] },
    { key: 'roommates', icon: 'home', balanceName: 'Ali', balanceAmount: -120, amounts: [900, 140, 35] },
    { key: 'couple', icon: 'favorite', balanceName: 'Lina', balanceAmount: 30, amounts: [210, 90, 540] },
    { key: 'event', icon: 'celebration', balanceName: 'Omar', balanceAmount: -85, amounts: [60, 150, 400] }
  ];

  protected readonly selectedKey = signal(this.audiences[0].key);

  protected itemLabelsFor(key: string): string[] {
    this.currentLang(); // recompute whenever the active language changes
    const example = this.transloco.translate(`audiences.${key}.example`);
    return example.split(',').map((label: string) => label.trim());
  }

  async ngAfterViewInit(): Promise<void> {
    const swiperEl = this.swiperRef()?.nativeElement;
    if (!swiperEl) {
      return;
    }

    // Loaded here, not app-wide, so this ~30kB only ever ships to visitors who reach this one
    // landing-page section instead of bloating every route's initial bundle.
    const { register } = await import('swiper/element');
    register();

    Object.assign(swiperEl, {
      slidesPerView: 1.08,
      centeredSlides: true,
      spaceBetween: 16,
      grabCursor: true
    });
    swiperEl.initialize();
    swiperEl.addEventListener('slidechange', () => {
      const index = swiperEl.swiper.activeIndex;
      this.selectedKey.set(this.audiences[index]?.key ?? this.audiences[0].key);
    });
  }

  /** Pill tap: moves the swiper too, so both controls always agree on the current audience. */
  protected select(key: string): void {
    this.selectedKey.set(key);
    const index = this.audiences.findIndex(a => a.key === key);
    this.swiperRef()?.nativeElement.swiper?.slideTo(index);
  }
}
