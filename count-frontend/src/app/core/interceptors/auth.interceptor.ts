import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

/**
 * Attaches "Authorization: Bearer <token>" to every request except auth endpoints
 * (register/login must not carry a stale or absent token).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();
  if (!token) {
    return next(req);
  }

  const authorizedRequest = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  });
  return next(authorizedRequest);
};
