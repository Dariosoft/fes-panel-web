import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { ExternalNavigation } from '../navigation/external-navigation';
import { PanelSession } from './panel-session';

describe('PanelSession', () => {
  let panelSession: PanelSession;
  let httpTesting: HttpTestingController;
  let externalNavigation: { navigateTo: ReturnType<typeof vi.fn> };
  const sessionUrl = `${environment.apiBaseUrl}/panel/identity/session`;

  beforeEach(() => {
    externalNavigation = { navigateTo: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExternalNavigation, useValue: externalNavigation },
      ],
    });
    panelSession = TestBed.inject(PanelSession);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets the current panel identity session with credentials', () => {
    panelSession.getSession().subscribe();

    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ authenticated: false });
  });

  it('deletes the current panel identity session with credentials', () => {
    panelSession.logout().subscribe();

    const request = httpTesting.expectOne(sessionUrl);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ authenticated: false });
  });

  it('navigates to the panel identity Google login endpoint', () => {
    panelSession.enterWithGoogle();

    expect(externalNavigation.navigateTo).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/panel/identity/login/google`,
    );
  });

  it('carries the current path as return_to', () => {
    panelSession.enterWithGoogle('/catalog?page=1');

    expect(externalNavigation.navigateTo).toHaveBeenCalledWith(
      `${environment.apiBaseUrl}/panel/identity/login/google?return_to=%2Fcatalog%3Fpage%3D1`,
    );
  });
});
