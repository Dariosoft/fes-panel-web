import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { Session } from './session';

describe('Session', () => {
  let session: Session;
  let httpTesting: HttpTestingController;
  const sessionUrl = `${environment.apiBaseUrl}/panel/identity/session`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    session = TestBed.inject(Session);
    httpTesting = TestBed.inject(HttpTestingController);
    history.replaceState({}, '', '/');
  });

  afterEach(() => {
    httpTesting.verify();
    history.replaceState({}, '', '/');
  });

  it('hydrates to authenticated when session returns identity', async () => {
    const hydratePromise = session.hydrate();
    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await hydratePromise;

    expect(session.authenticated()).toBe(true);
    expect(session.profile()?.name).toBe('Ada Lovelace');
    expect(session.profile()?.email).toBe('ada@example.com');
    expect(session.notice()).toBeNull();
  });

  it('hydrates to anonymous without notice when session is unauthenticated', async () => {
    const hydratePromise = session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({ authenticated: false });
    await hydratePromise;

    expect(session.authenticated()).toBe(false);
    expect(session.profile()).toBeNull();
    expect(session.notice()).toBeNull();
  });

  it('hydrates to anonymous with notice when session lookup fails', async () => {
    const hydratePromise = session.hydrate();
    httpTesting.expectOne(sessionUrl).flush('error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await hydratePromise;

    expect(session.authenticated()).toBe(false);
    expect(session.notice()).toBe('No se pudo comprobar la sesión.');
  });

  it('forces anonymous UI and clears login_error from the URL', async () => {
    history.replaceState({}, '', '/?login_error=1');

    const hydratePromise = session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({ authenticated: false });
    await hydratePromise;

    expect(session.authenticated()).toBe(false);
    expect(session.notice()).toBe('No se pudo entrar.');
    expect(globalThis.location.search).not.toContain('login_error');
  });

  it('logs out to anonymous on success', async () => {
    const hydratePromise = session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await hydratePromise;

    const logoutPromise = session.logout();
    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ authenticated: false });
    await logoutPromise;

    expect(session.authenticated()).toBe(false);
    expect(session.profile()).toBeNull();
    expect(session.notice()).toBeNull();
  });

  it('keeps authenticated state and shows notice when logout fails', async () => {
    const hydratePromise = session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    await hydratePromise;

    const logoutPromise = session.logout();
    httpTesting.expectOne(sessionUrl).flush('error', {
      status: 503,
      statusText: 'Service Unavailable',
    });
    await logoutPromise;

    expect(session.authenticated()).toBe(true);
    expect(session.profile()?.email).toBe('ada@example.com');
    expect(session.notice()).toBe('No se pudo salir.');
  });

  it('navigates to panel Google login on enterWithGoogle', () => {
    const assignSpy = vi.fn();
    const originalLocation = globalThis.location;
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy, href: originalLocation.href },
    });

    try {
      session.enterWithGoogle();
      expect(assignSpy).toHaveBeenCalledWith(
        `${environment.apiBaseUrl}/panel/identity/login/google`,
      );
    } finally {
      Object.defineProperty(globalThis, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
