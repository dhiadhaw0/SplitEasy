import { HttpContext, HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../models/api-error.model';

/**
 * Set on a request (via `withSilentErrors()` below) when the calling component already shows
 * the backend's error message inline (typically a dialog form) and the global snackbar would
 * just duplicate it. 401 handling (forced logout) still applies regardless.
 */
export const SKIP_ERROR_NOTIFICATION = new HttpContextToken<boolean>(() => false);

export function withSilentErrors(): { context: HttpContext } {
  return { context: new HttpContext().set(SKIP_ERROR_NOTIFICATION, true) };
}

/**
 * Centralizes error → user-feedback mapping so individual components don't have to.
 * The error is always rethrown so a component can still react (e.g. highlight a field).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthRequest = req.url.includes('/auth/');
      const apiError = error.error as ApiError | undefined;
      const silent = req.context.get(SKIP_ERROR_NOTIFICATION);

      if (error.status === 401) {
        if (!isAuthRequest) {
          authService.logout();
        }
      } else if (silent) {
        // The caller already displays this error inline; avoid showing it twice.
      } else if (error.status === 403) {
        notification.error('Accès refusé.');
      } else if (error.status === 0) {
        notification.error('Serveur injoignable. Vérifiez votre connexion.');
      } else {
        notification.error(apiError?.message ?? 'Une erreur est survenue. Veuillez réessayer.');
      }

      return throwError(() => error);
    })
  );
};
