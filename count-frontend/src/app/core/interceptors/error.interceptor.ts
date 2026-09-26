import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { ApiError } from '../models/api-error.model';

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

      if (error.status === 401) {
        if (!isAuthRequest) {
          authService.logout();
        }
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
