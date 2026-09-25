import { Component, inject } from '@angular/core';
import { Session } from './session';

/**
 * Shell identity controls: Entrar / identity / Salir.
 * Presentation only — session actions live in Session.
 */
@Component({
  selector: 'app-identity-bar',
  standalone: true,
  template: `
    <div class="identity-bar">
      @if (session.notice(); as notice) {
        <p class="identity-notice" role="status">{{ notice.message }}</p>
      }

      @if (session.isAuthenticated()) {
        @if (session.profile(); as profile) {
          <div class="identity-profile">
            <span class="identity-name">{{ profile.name }}</span>
            <span class="identity-email">{{ profile.email }}</span>
          </div>
        }
        <button type="button" class="identity-action" (click)="onLogout()">
          Salir
        </button>
      } @else {
        <button type="button" class="identity-action" (click)="onLogin()">
          Entrar
        </button>
      }
    </div>
  `,
  styles: `
    .identity-bar {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
      min-width: 0;
    }

    .identity-notice {
      margin: 0;
      padding: 0.5rem 0.65rem;
      font-family: system-ui, sans-serif;
      font-size: 0.85rem;
      line-height: 1.4;
      color: #1d2421;
      background: #e8c07a;
      border: 1px solid #c9a05a;
    }

    .identity-profile {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      min-width: 0;
    }

    .identity-name {
      font-family: system-ui, sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      color: #f3ead8;
      overflow-wrap: anywhere;
    }

    .identity-email {
      font-family: system-ui, sans-serif;
      font-size: 0.8rem;
      color: #bcc5bf;
      overflow-wrap: anywhere;
    }

    .identity-action {
      appearance: none;
      cursor: pointer;
      min-height: 44px;
      padding: 0.55rem 1rem;
      font-family: system-ui, sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      color: #1d2421;
      background: #c9e2b5;
      border: 1px solid #a8c994;
      transition: background-color 180ms ease, border-color 180ms ease;
    }

    .identity-action:hover {
      background: #d7ecc8;
    }

    .identity-action:focus-visible {
      outline: 2px solid #f3ead8;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      .identity-action {
        transition: none;
      }
    }
  `,
})
export class IdentityBar {
  readonly session = inject(Session);

  onLogin(): void {
    void this.session.startLogin();
  }

  onLogout(): void {
    void this.session.logout();
  }
}
