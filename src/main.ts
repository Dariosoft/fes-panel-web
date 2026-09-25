import { Component, inject } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAppInitializer } from '@angular/core';
import { Session } from './app/identity/session';
import { IdentityBar } from './app/identity/identity-bar';
import { sessionInvalidationInterceptor } from './app/identity/session-invalidation.interceptor';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IdentityBar],
  template: `
    <main>
      <aside>
        <div class="brand">
          <strong>Friendly</strong>
          <span>Panel</span>
        </div>
        <app-identity-bar />
      </aside>
      <section>
        <p class="eyebrow">Panel de vendedores</p>
        <h1>Tu tienda empieza acá.</h1>
        <p>
          La base operativa está lista para incorporar productos, stock y
          precios.
        </p>
      </section>
    </main>
  `,
})
export class AppComponent {}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([sessionInvalidationInterceptor])),
    provideAppInitializer(() => {
      const session = inject(Session);
      return session.hydrate();
    }),
  ],
}).catch(console.error);
