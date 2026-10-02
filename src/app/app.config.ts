import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Session } from './core/services/session/session';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Wait for session hydration so every view renders with the resolved auth state.
    provideAppInitializer(() => {
      const session = inject(Session);
      session.hydrate();
      return session.whenHydrated;
    }),
  ],
};
