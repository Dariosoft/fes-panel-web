import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Session } from './core/services/session/session';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Fire-and-forget session hydration keeps the admin shell responsive while session state loads.
    provideAppInitializer(() => inject(Session).hydrate()),
  ],
};
