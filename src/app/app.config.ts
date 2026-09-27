import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Session } from './core/session/session';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAppInitializer(() => inject(Session).hydrate()),
  ],
};
