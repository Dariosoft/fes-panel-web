import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ExternalNavigation } from '../navigation/external-navigation';
import { Session } from './session';

describe('Session', () => {
  let session: Session;
  let httpTesting: HttpTestingController;
  let router: {
    url: string;
    navigate: ReturnType<typeof vi.fn>;
    parseUrl: ReturnType<typeof vi.fn>;
  };
  let externalNavigation: { navigateTo: ReturnType<typeof vi.fn> };
  const sessionUrl = `${environment.apiBaseUrl}/panel/identity/session`;

  beforeEach(() => {
    router = {
      url: '/',
      navigate: vi.fn(() => Promise.resolve(true)),
      parseUrl: vi.fn((url: string) => ({
        queryParams: url.includes('login_error') ? { login_error: '1' } : {},
      })),
    };
    externalNavigation = { navigateTo: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
        { provide: ExternalNavigation, useValue: externalNavigation },
      ],
    });
    session = TestBed.inject(Session);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('hydrates to authenticated when session returns identity', () => {
    session.hydrate();
    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    expect(session.authenticated()).toBe(true);
    expect(session.profile()?.name).toBe('Ada Lovelace');
    expect(session.profile()?.email).toBe('ada@example.com');
    expect(session.notice()).toBeNull();
  });

  it('hydrates to anonymous without notice when session is unauthenticated', () => {
    session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({ authenticated: false });

    expect(session.authenticated()).toBe(false);
    expect(session.profile()).toBeNull();
    expect(session.notice()).toBeNull();
  });

  it('hydrates to anonymous with notice when session lookup fails', () => {
    session.hydrate();
    httpTesting.expectOne(sessionUrl).flush('error', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(session.authenticated()).toBe(false);
    expect(session.notice()).toBe('No se pudo comprobar la sesión.');
  });

  it('forces anonymous UI and clears login_error from the URL', () => {
    router.url = '/?login_error=1';

    session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({ authenticated: false });

    expect(session.authenticated()).toBe(false);
    expect(session.notice()).toBe('No se pudo entrar.');
    expect(router.navigate).toHaveBeenCalledWith([], {
      queryParams: { login_error: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('logs out to anonymous on success', () => {
    session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    session.logout();
    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ authenticated: false });

    expect(session.authenticated()).toBe(false);
    expect(session.profile()).toBeNull();
    expect(session.notice()).toBeNull();
  });

  it('keeps authenticated state and shows notice when logout fails', () => {
    session.hydrate();
    httpTesting.expectOne(sessionUrl).flush({
      authenticated: true,
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });

    session.logout();
    httpTesting.expectOne(sessionUrl).flush('error', {
      status: 503,
      statusText: 'Service Unavailable',
    });

    expect(session.authenticated()).toBe(true);
    expect(session.profile()?.email).toBe('ada@example.com');
    expect(session.notice()).toBe('No se pudo salir.');
  });

  it('navigates to panel Google login on enterWithGoogle', () => {
    session.enterWithGoogle();

    expect(externalNavigation.navigateTo).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/panel/identity/login/google`,
    );
  });
});
