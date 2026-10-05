import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

/**
 * The '/' route serves two very different audiences: a web visitor who needs the full marketing
 * landing page (features, FAQ, pricing-style sections meant to be researched and scrolled), and
 * someone opening the installed native app, who needs a compact welcome screen instead — cramming
 * a long scrolling marketing page into a phone-sized native shell reads as broken, not "web-like".
 */
export const nativeEntryGuard: CanActivateFn = () => {
  const router = inject(Router);

  if (Capacitor.isNativePlatform()) {
    return router.createUrlTree(['/welcome']);
  }

  return true;
};
