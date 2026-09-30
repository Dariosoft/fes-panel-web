import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { App } from './app';
import { Session } from './core/services/session/session';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Session,
          useValue: {
            authenticated: () => false,
            profile: () => null,
            notice: () => null,
            enterWithGoogle: () => undefined,
            logout: () => undefined,
          },
        },
      ],
    });
  });

  it('renders the panel home at the root path', async () => {
    const harness = await RouterTestingHarness.create('/');
    const view = harness.routeNativeElement;

    expect(view?.querySelector('h1')?.textContent).toContain('Tu tienda empieza acá.');
  });

  it('keeps the admin sidebar in the app shell around routed content', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.querySelector('aside')?.textContent).toContain('Friendly');
    expect(nativeElement.querySelector('app-session-bar')).not.toBeNull();
    expect(nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
