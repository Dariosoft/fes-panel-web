import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PanelSession } from './panel-session';
import { AuthenticatedSessionProfile } from './session-profile';

const LOGIN_ERROR_PARAM = 'login_error';

export type SessionStatus = 'anonymous' | 'authenticated';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly panelSession = inject(PanelSession);

  private readonly statusSignal = signal<SessionStatus>('anonymous');
  private readonly profileSignal = signal<AuthenticatedSessionProfile | null>(null);
  private readonly noticeSignal = signal<string | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly notice = this.noticeSignal.asReadonly();
  readonly authenticated = computed(() => this.statusSignal() === 'authenticated');

  async hydrate(): Promise<void> {
    try {
      const session = await firstValueFrom(this.panelSession.getSession());
      if (session.authenticated && session.name && session.email) {
        this.setAuthenticated(session);
      } else {
        this.setAnonymous();
      }
    } catch {
      this.setAnonymous('No se pudo comprobar la sesión.');
    }

    this.applyLoginErrorFromUrl();
  }

  enterWithGoogle(): void {
    globalThis.location.assign(`${environment.apiBaseUrl}/panel/identity/login/google`);
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.panelSession.logout());
      this.setAnonymous();
    } catch {
      this.noticeSignal.set('No se pudo salir.');
    }
  }

  private applyLoginErrorFromUrl(): void {
    const url = new URL(globalThis.location.href);
    if (!url.searchParams.has(LOGIN_ERROR_PARAM)) {
      return;
    }

    this.setAnonymous('No se pudo entrar.');
    url.searchParams.delete(LOGIN_ERROR_PARAM);
    globalThis.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  private setAuthenticated(profile: AuthenticatedSessionProfile): void {
    this.statusSignal.set('authenticated');
    this.profileSignal.set(profile);
    this.noticeSignal.set(null);
  }

  private setAnonymous(notice: string | null = null): void {
    this.statusSignal.set('anonymous');
    this.profileSignal.set(null);
    this.noticeSignal.set(notice);
  }
}
