import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { SESSION_STATUS, SessionStatus } from '../../constants/session-status';
import { AuthenticatedSessionProfile } from '../../models/session-profile';
import { PanelSession } from './panel-session';

const LOGIN_ERROR_PARAM = 'login_error';

@Injectable({ providedIn: 'root' })
export class Session {
  private readonly panelSession = inject(PanelSession);
  private readonly router = inject(Router);

  private readonly statusSignal = signal<SessionStatus>(SESSION_STATUS.anonymous);
  private readonly profileSignal = signal<AuthenticatedSessionProfile | null>(null);
  private readonly noticeSignal = signal<string | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly notice = this.noticeSignal.asReadonly();
  readonly authenticated = computed(() => this.statusSignal() === SESSION_STATUS.authenticated);

  private resolveHydrated!: () => void;

  readonly whenHydrated = new Promise<void>((resolve) => {
    this.resolveHydrated = resolve;
  });

  hydrate(): void {
    this.panelSession
      .getSession()
      .pipe(timeout(5000))
      .subscribe({
        next: (session) => {
          if (session.authenticated && session.name && session.email) {
            this.setAuthenticated(session);
          } else {
            this.setAnonymous();
          }
          this.applyLoginErrorFromUrl();
          this.resolveHydrated();
        },
        error: () => {
          this.setAnonymous('No se pudo comprobar la sesión.');
          this.applyLoginErrorFromUrl();
          this.resolveHydrated();
        },
      });
  }

  enterWithGoogle(): void {
    this.panelSession.enterWithGoogle();
  }

  logout(): void {
    this.panelSession.logout().subscribe({
      next: () => this.setAnonymous(),
      error: () => this.noticeSignal.set('No se pudo salir.'),
    });
  }

  private applyLoginErrorFromUrl(): void {
    const urlTree = this.router.parseUrl(this.router.url);
    if (!(LOGIN_ERROR_PARAM in urlTree.queryParams)) {
      return;
    }

    this.setAnonymous('No se pudo entrar.');
    void this.router.navigate([], {
      queryParams: { [LOGIN_ERROR_PARAM]: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private setAuthenticated(profile: AuthenticatedSessionProfile): void {
    this.statusSignal.set(SESSION_STATUS.authenticated);
    this.profileSignal.set(profile);
    this.noticeSignal.set(null);
  }

  private setAnonymous(notice: string | null = null): void {
    this.statusSignal.set(SESSION_STATUS.anonymous);
    this.profileSignal.set(null);
    this.noticeSignal.set(notice);
  }
}
