import { Component, inject } from '@angular/core';
import { Session } from '../../core/session/session';
import { SessionBar } from './components/session-bar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [SessionBar],
  template: `
    <main>
      <aside>
        <div>
          <strong>Friendly</strong>
          <span>Panel</span>
        </div>
        <app-session-bar
          [authenticated]="session.authenticated()"
          [name]="session.profile()?.name ?? ''"
          [email]="session.profile()?.email ?? ''"
          [notice]="session.notice()"
          (enterWithGoogle)="session.enterWithGoogle()"
          (logout)="session.logout()"
        />
      </aside>
      <section>
        <p class="eyebrow">Panel de vendedores</p>
        <h1>Tu tienda empieza acá.</h1>
        <p>La base operativa está lista para incorporar productos, stock y precios.</p>
      </section>
    </main>
  `,
})
export class Shell {
  protected readonly session = inject(Session);
}
