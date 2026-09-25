import { Injectable, computed, signal } from '@angular/core';
import { SessionProfile } from './session.model';

export type SessionStatus = 'anonymous' | 'authenticated';

export type SessionNoticeKind =
  | 'login-failed'
  | 'logout-failed'
  | 'session-invalid';

export interface SessionNotice {
  kind: SessionNoticeKind;
  message: string;
}

/**
 * In-memory session state for the panel.
 * Does not persist profile/account to localStorage, IndexedDB, or own cookies.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly statusSignal = signal<SessionStatus>('anonymous');
  private readonly profileSignal = signal<SessionProfile | null>(null);
  private readonly noticeSignal = signal<SessionNotice | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly profile = this.profileSignal.asReadonly();
  readonly notice = this.noticeSignal.asReadonly();
  readonly isAuthenticated = computed(
    () => this.statusSignal() === 'authenticated',
  );

  setAuthenticated(profile: SessionProfile): void {
    this.profileSignal.set(profile);
    this.statusSignal.set('authenticated');
  }

  setAnonymous(): void {
    this.profileSignal.set(null);
    this.statusSignal.set('anonymous');
  }

  setNotice(notice: SessionNotice): void {
    this.noticeSignal.set(notice);
  }

  clearNotice(): void {
    this.noticeSignal.set(null);
  }
}
