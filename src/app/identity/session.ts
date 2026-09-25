import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PanelApiIdentityClient } from './panel-api-identity-client';
import { SessionLookupResponse } from './session.model';
import { SessionStore } from './session-store';

/**
 * Session actions: hydrate from panel-api, enter, leave.
 * Source of truth for identity is panel-api; this service only reflects it in memory.
 */
@Injectable({ providedIn: 'root' })
export class Session {
  private readonly client = inject(PanelApiIdentityClient);
  private readonly store = inject(SessionStore);

  readonly status = this.store.status;
  readonly profile = this.store.profile;
  readonly notice = this.store.notice;
  readonly isAuthenticated = this.store.isAuthenticated;

  /** Probe panel-api for the current shared session (open / reload / OAuth return). */
  async hydrate(): Promise<void> {
    try {
      const result = await firstValueFrom(this.client.getSession());
      this.applySessionLookup(result);
    } catch {
      this.store.setAnonymous();
    }
  }

  /**
   * Applies a confirmed session from panel-api (RF-4).
   * When authenticated with name+email, marks identified; otherwise anonymous.
   */
  applySessionLookup(result: SessionLookupResponse): void {
    if (result.authenticated && result.name && result.email) {
      this.store.setAuthenticated({
        name: result.name,
        email: result.email,
      });
      return;
    }
    this.store.setAnonymous();
  }

  /**
   * Starts Google access only through panel-api (no local email/password form).
   * On success, navigates to the authorization URL returned by panel-api.
   * On failure, stays anonymous and shows a Spanish notice (RF-12).
   */
  async startLogin(): Promise<void> {
    this.store.clearNotice();
    try {
      const result = await firstValueFrom(this.client.startGoogleLogin());
      if (!result.authorizationUrl) {
        this.store.setAnonymous();
        this.store.setNotice({
          kind: 'login-failed',
          message: 'No se pudo entrar. Inténtalo de nuevo.',
        });
        return;
      }
      globalThis.location.assign(result.authorizationUrl);
    } catch {
      this.store.setAnonymous();
      this.store.setNotice({
        kind: 'login-failed',
        message: 'No se pudo entrar. Inténtalo de nuevo.',
      });
    }
  }

  /**
   * Closes the shared session via panel-api only (RF-7).
   * On success, becomes anonymous and the panel stays usable (RF-8).
   * On failure, stays identified and shows a Spanish notice (RF-13).
   */
  async logout(): Promise<void> {
    this.store.clearNotice();
    try {
      await firstValueFrom(this.client.logout());
      this.store.setAnonymous();
    } catch {
      this.store.setNotice({
        kind: 'logout-failed',
        message: 'No se pudo salir. Inténtalo de nuevo.',
      });
    }
  }

  clearNotice(): void {
    this.store.clearNotice();
  }
}
