import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { TranslocoService } from '@jsverse/transloco';
import { LandingToolbarComponent } from './landing-toolbar/landing-toolbar.component';
import { LandingHeroComponent } from './landing-hero/landing-hero.component';
import { LandingProblemComponent } from './landing-problem/landing-problem.component';
import { LandingDemoComponent } from './landing-demo/landing-demo.component';
import { LandingStepsComponent } from './landing-steps/landing-steps.component';
import { LandingFeaturesComponent } from './landing-features/landing-features.component';
import { LandingAudiencesComponent } from './landing-audiences/landing-audiences.component';
import { LandingFaqComponent } from './landing-faq/landing-faq.component';
import { LandingFinalCtaComponent } from './landing-final-cta/landing-final-cta.component';
import { LandingFooterComponent } from './landing-footer/landing-footer.component';

interface SeoTranslation {
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    LandingToolbarComponent,
    LandingHeroComponent,
    LandingProblemComponent,
    LandingDemoComponent,
    LandingStepsComponent,
    LandingFeaturesComponent,
    LandingAudiencesComponent,
    LandingFaqComponent,
    LandingFinalCtaComponent,
    LandingFooterComponent
  ],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent implements OnInit {
  private readonly titleService = inject(Title);
  private readonly metaService = inject(Meta);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.transloco
      .selectTranslateObject<SeoTranslation>('seo')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(seo => {
        this.titleService.setTitle(seo.title);
        this.metaService.updateTag({ name: 'description', content: seo.description });
        this.metaService.updateTag({ property: 'og:title', content: seo.title });
        this.metaService.updateTag({ property: 'og:description', content: seo.description });
        this.metaService.updateTag({ property: 'og:type', content: 'website' });
        // Locale-independent, so set once here rather than duplicated across seo.* translations;
        // index.html carries the same path as a static fallback for crawlers that never run this JS.
        this.metaService.updateTag({ property: 'og:image', content: '/og-image.png' });
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
        this.metaService.updateTag({ name: 'twitter:title', content: seo.title });
        this.metaService.updateTag({ name: 'twitter:description', content: seo.description });
        this.metaService.updateTag({ name: 'twitter:image', content: '/og-image.png' });
      });
  }
}
