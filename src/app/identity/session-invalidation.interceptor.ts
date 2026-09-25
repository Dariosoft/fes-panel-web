import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionStore } from './session-store';

/**
 * When panel-api no longer recognizes the user (401/403), clear in-memory
 * identity, show a Spanish notice, and keep the panel usable (RF-15).
 * Does not redirect to a login wall.
 */
export const sessionInvalidationInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {
  const store = inject(SessionStore);
  return next(req).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        (error.status === 401 || error.status === 403) &&
        store.isAuthenticated()
      ) {
        store.setAnonymous();
        store.setNotice({
          kind: 'session-invalid',
          message: 'Tu sesión ya no es válida. Puedes seguir usando el panel.',
        });
      }
      return throwError(() => error);
    }),
  );
};
