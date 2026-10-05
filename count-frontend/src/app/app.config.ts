import { ApplicationConfig, LOCALE_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideTransloco } from '@jsverse/transloco';
import { Capacitor } from '@capacitor/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { TranslocoHttpLoader } from './core/transloco-loader';
import { environment } from '../environments/environment';

registerLocaleData(localeFr);

// Inside the native Capacitor shell, "localhost" means the phone itself, not the dev machine —
// see nativeApiUrl's doc comment in environment.ts for how to point this at a real device.
if (Capacitor.isNativePlatform()) {
  environment.apiUrl = environment.nativeApiUrl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    provideCharts(withDefaultRegisterables()),
    // Global DateAdapter so any mat-datepicker works out of the box (previously only the
    // expense form imported MatNativeDateModule itself; the savings-goal dialog's own
    // <mat-datepicker> had none, which crashed MatDialog while constructing that component —
    // and that uncaught error inside the overlay stack silently broke subsequent dialog opens
    // in the same session, which is why the Budget dialog also appeared to "do nothing" right after).
    provideNativeDateAdapter(),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    // Every mat-dialog in the app (group/participant forms, confirmations) picks up the
    // rounded "cute" panel styling in styles.scss for free, without touching each call site.
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { panelClass: 'se-dialog-panel' } },
    // Transloco currently only backs the public landing page (see features/landing);
    // the authenticated app remains French-only for now.
    provideTransloco({
      config: {
        availableLangs: ['fr', 'en', 'ar'],
        defaultLang: 'fr',
        reRenderOnLangChange: true,
        prodMode: environment.production
      },
      loader: TranslocoHttpLoader
    })
  ]
};
