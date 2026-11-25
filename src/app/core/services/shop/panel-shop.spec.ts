import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Shop } from '../../models/shop';
import { PanelShop } from './panel-shop';

describe('PanelShop', () => {
  let panelShop: PanelShop;
  let httpTesting: HttpTestingController;

  const shopUrl = `${environment.apiBaseUrl}/panel/shop`;
  const shop: Shop = { name: 'Mi tienda', description: 'Productos artesanales' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    panelShop = TestBed.inject(PanelShop);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('gets the shop under the panel shop boundary with credentials', () => {
    let result: Shop | null | undefined;
    panelShop.get().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(shopUrl);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush(shop);

    expect(result).toEqual(shop);
  });

  it('returns null when the account does not have a shop yet', () => {
    let result: Shop | null | undefined;
    panelShop.get().subscribe((value) => (result = value));

    const request = httpTesting.expectOne(shopUrl);
    request.flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });

    expect(result).toBeNull();
  });

  it('propagates unexpected load errors', () => {
    let status: number | undefined;
    panelShop.get().subscribe({
      error: (error: { status?: number }) => (status = error.status),
    });

    const request = httpTesting.expectOne(shopUrl);
    request.flush('failure', { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('saves the shop as JSON with credentials', () => {
    let result: Shop | undefined;
    panelShop.save(shop).subscribe((value) => (result = value));

    const request = httpTesting.expectOne(shopUrl);
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    expect(request.request.body).toEqual(shop);
    request.flush(shop);

    expect(result).toEqual(shop);
  });

  it('propagates a 404 on save as an error', () => {
    let status: number | undefined;
    panelShop.save(shop).subscribe({
      error: (error: { status?: number }) => (status = error.status),
    });

    const request = httpTesting.expectOne(shopUrl);
    request.flush('missing', { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });
});
