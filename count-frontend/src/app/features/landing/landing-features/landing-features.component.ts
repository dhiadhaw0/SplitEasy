import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, ElementRef, signal, viewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';
import type { SwiperContainer } from 'swiper/element';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

const ACCENT_BACKGROUNDS = ['var(--se-mint-bg)', 'var(--se-sun-bg)', 'var(--se-coral-bg)', 'var(--se-violet-bg)'];

@Component({
  selector: 'app-landing-features',
  standalone: true,
  imports: [MatIconModule, TranslocoPipe, AnimateInDirective],
  templateUrl: './landing-features.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // <swiper-container>/<swiper-slide> are custom elements (registered once in main.ts), not
  // Angular components — this tells the template compiler not to expect metadata for them.
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LandingFeaturesComponent implements AfterViewInit {
  private readonly swiperRef = viewChild<ElementRef<SwiperContainer>>('swiperEl');

  /** Which card is active, driven by the swiper itself (swipe, drag, or the dot below). */
  protected readonly activeCard = signal(0);
  protected readonly cardCount = 4;

  protected readonly secondaryFeatures = [
    { icon: 'percent', key: 'features.secondary.splitTypes' },
    { icon: 'person_off', key: 'features.secondary.noAccount' },
    { icon: 'link', key: 'features.secondary.inviteLink' },
    { icon: 'filter_alt', key: 'features.secondary.filters' },
    { icon: 'edit_note', key: 'features.secondary.editDelete' },
    { icon: 'dark_mode', key: 'features.secondary.darkMode' },
    { icon: 'currency_exchange', key: 'features.secondary.currencyConversion' },
    { icon: 'event_repeat', key: 'features.secondary.recurring' },
    { icon: 'document_scanner', key: 'features.secondary.ocrScan' },
    { icon: 'file_download', key: 'features.secondary.pdfExport' },
    { icon: 'fingerprint', key: 'features.secondary.biometric' }
  ];

  protected accentBg(index: number): string {
    return ACCENT_BACKGROUNDS[index % ACCENT_BACKGROUNDS.length];
  }

  async ngAfterViewInit(): Promise<void> {
    const swiperEl = this.swiperRef()?.nativeElement;
    if (!swiperEl) {
      return;
    }

    // Loaded here, not app-wide, so this ~30kB only ever ships to visitors who reach this one
    // landing-page section instead of bloating every route's initial bundle. The "Pour qui ?"
    // carousel further down the page registers the same custom element a second time; Swiper's
    // register() is idempotent, so that's a harmless no-op, not a double-load.
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
      this.activeCard.set(swiperEl.swiper.activeIndex);
    });
  }

  /** Dot tap: moves the swiper too, so both controls always agree on the current card. */
  protected goTo(index: number): void {
    this.activeCard.set(index);
    this.swiperRef()?.nativeElement.swiper?.slideTo(index);
  }
}
