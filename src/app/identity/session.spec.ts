import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../environments/environment';
import { Session } from './session';
import { sessionInvalidationInterceptor } from './session-invalidation.interceptor';
import { SessionStore } from './session-store';

describe('Session', () => {
  let session: Session;
  let http: HttpTestingController;
  let store: SessionStore;
  const base = environment.panelApiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(Session);
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(SessionStore);
  });

  afterEach(() => {
    http.verify();
  });

  it('marks identified after panel-api confirms session (login / hydrate)', async () => {
    const hydratePromise = session.hydrate();
    const req = http.expectOne(`${base}/panel/identity/me`);
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      authenticated: true,
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await hydratePromise;

    expect(session.isAuthenticated()).toBe(true);
    expect(session.profile()).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('stays anonymous and sets notice when login fails', async () => {
    const loginPromise = session.startLogin();
    const req = http.expectOne(`${base}/panel/identity/google/start`);
    req.flush(
      { message: 'denied' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await loginPromise;

    expect(session.isAuthenticated()).toBe(false);
    expect(session.notice()?.kind).toBe('login-failed');
    expect(session.notice()?.message).toContain('No se pudo entrar');
  });

  it('becomes anonymous after successful logout', async () => {
    store.setAuthenticated({ name: 'Ada', email: 'ada@example.com' });
    const logoutPromise = session.logout();
    const req = http.expectOne(`${base}/panel/identity/logout`);
    expect(req.request.method).toBe('POST');
    req.flush(null);
    await logoutPromise;

    expect(session.isAuthenticated()).toBe(false);
    expect(session.profile()).toBeNull();
  });

  it('keeps identity and sets notice when logout fails', async () => {
    store.setAuthenticated({ name: 'Ada', email: 'ada@example.com' });
    const logoutPromise = session.logout();
    const req = http.expectOne(`${base}/panel/identity/logout`);
    req.flush(
      { message: 'error' },
      { status: 500, statusText: 'Server Error' },
    );
    await logoutPromise;

    expect(session.isAuthenticated()).toBe(true);
    expect(session.profile()?.email).toBe('ada@example.com');
    expect(session.notice()?.kind).toBe('logout-failed');
    expect(session.notice()?.message).toContain('No se pudo salir');
  });

  it('hydrates as anonymous when panel-api has no session', async () => {
    const hydratePromise = session.hydrate();
    const req = http.expectOne(`${base}/panel/identity/me`);
    req.flush({ authenticated: false });
    await hydratePromise;

    expect(session.isAuthenticated()).toBe(false);
    expect(session.profile()).toBeNull();
  });

  it('does not write profile to localStorage', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const hydratePromise = session.hydrate();
    http.expectOne(`${base}/panel/identity/me`).flush({
      authenticated: true,
      name: 'Ada',
      email: 'ada@example.com',
    });
    await hydratePromise;
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });
});

describe('sessionInvalidationInterceptor', () => {
  let http: HttpTestingController;
  let store: SessionStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([sessionInvalidationInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(SessionStore);
    store.setAuthenticated({ name: 'Ada', email: 'ada@example.com' });
  });

  afterEach(() => {
    http.verify();
  });

  it('clears identity and shows notice on 401 while authenticated', async () => {
    const client = TestBed.inject(HttpClient);
    const requestPromise = new Promise<void>((resolve) => {
      client.get('/panel/anything').subscribe({
        error: () => resolve(),
      });
    });
    const req = http.expectOne('/panel/anything');
    req.flush(
      { message: 'unrecognized' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await requestPromise;

    expect(store.isAuthenticated()).toBe(false);
    expect(store.notice()?.kind).toBe('session-invalid');
    expect(store.notice()?.message).toContain('sesión ya no es válida');
  });
});
