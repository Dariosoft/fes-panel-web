import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('renders the panel home at the root path', async () => {
    const harness = await RouterTestingHarness.create('/');
    const view = harness.routeNativeElement;

    expect(view?.querySelector('h1')?.textContent).toContain('Tu tienda empieza acá.');
    expect(view?.querySelector('button')?.textContent).toContain('Entrar con Google');
  });
});