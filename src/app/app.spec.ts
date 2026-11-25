import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { App } from './app';
import { Session } from './core/services/session/session';

describe('App routes', () => {
  const configure = (authenticated: boolean): void => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: Session,
          useValue: {
            authenticated: () => authenticated,
            profile: () => null,
            notice: () => null,
            enterWithGoogle: () => undefined,
            logout: () => undefined,
          },
        },
      ],
    });
  };

  it('renders the panel home at the root path', async () => {
    configure(false);

    const harness = await RouterTestingHarness.create('/');
    const view = harness.routeNativeElement;

    expect(view?.querySelector('h1')?.textContent).toContain('Tu tienda empieza acá.');
  });

  it('keeps the admin sidebar in the app shell around routed content', async () => {
    configure(false);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.querySelector('aside')?.textContent).toContain('Friendly');
    expect(nativeElement.querySelector('app-session-bar')).not.toBeNull();
    expect(nativeElement.querySelector('router-outlet')).not.toBeNull();
  });

  it('hides the shop navigation without a session', async () => {
    configure(false);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement: HTMLElement = fixture.nativeElement;
    expect(nativeElement.querySelectorAll('a[href="/shop"]')).toHaveLength(0);
    expect(nativeElement.textContent).not.toContain('Mi tienda');
  });

  it('shows the shop navigation in both menus with a session', async () => {
    configure(true);

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();

    const nativeElement: HTMLElement = fixture.nativeElement;
    const shopLinks = nativeElement.querySelectorAll('a[href="/shop"]');

    expect(shopLinks).toHaveLength(2);
    shopLinks.forEach((link) => expect(link.textContent).toContain('Mi tienda'));
  });

  it('opens the shop route with its document title', async () => {
    configure(false);

    await RouterTestingHarness.create('/shop');

    expect(document.title).toBe('Mi tienda | Friendly E-Shop');
    expect(document.body.textContent).toContain('Iniciá sesión para gestionar tu tienda.');
  });
});
