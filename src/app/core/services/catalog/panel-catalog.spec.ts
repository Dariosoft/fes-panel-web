import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { EditableProduct } from '../../models/catalog-product';
import { PanelCatalog } from './panel-catalog';

describe('PanelCatalog', () => {
  let panelCatalog: PanelCatalog;
  let httpTesting: HttpTestingController;

  const baseUrl = `${environment.apiBaseUrl}/panel/catalog`;
  const editable: EditableProduct = {
    name: 'Mate',
    price: 1500,
    currency: 'ARS',
    stock: 3,
    images: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    panelCatalog = TestBed.inject(PanelCatalog);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('lists products with credentials under the panel catalog boundary', () => {
    panelCatalog.list().subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/products`);
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('creates products as multipart with credentials', () => {
    const file = new File(['image'], 'mate.png', { type: 'image/png' });

    panelCatalog.create({ ...editable, images: [{ id: 'image-1', file, name: 'mate.png' }] }).subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/products`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);

    const body = request.request.body as FormData;
    expect(body.get('name')).toBe('Mate');
    expect(body.get('price')).toBe('1500');
    expect(body.get('currency')).toBe('ARS');
    expect(body.get('stock')).toBe('3');
    expect(body.get('images')).toBeInstanceOf(File);
    request.flush({});
  });

  it('updates products under the product path with credentials', () => {
    panelCatalog.update({ ...editable, id: 'product-1' }).subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/products/product-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    request.flush({});
  });

  it('deletes products under the product path with credentials', () => {
    panelCatalog.delete('product-1').subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/products/product-1`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);
  });

  it('publishes and unpublishes products with credentials', () => {
    panelCatalog.publish('product-1').subscribe();
    panelCatalog.unpublish('product-1').subscribe();

    const publishRequest = httpTesting.expectOne(`${baseUrl}/products/product-1/publish`);
    expect(publishRequest.request.method).toBe('POST');
    expect(publishRequest.request.withCredentials).toBe(true);
    publishRequest.flush({});

    const unpublishRequest = httpTesting.expectOne(`${baseUrl}/products/product-1/unpublish`);
    expect(unpublishRequest.request.method).toBe('POST');
    expect(unpublishRequest.request.withCredentials).toBe(true);
    unpublishRequest.flush({});
  });

  it('publishes the whole catalog with credentials', () => {
    panelCatalog.publishCatalog().subscribe();

    const request = httpTesting.expectOne(`${baseUrl}/publish`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });
});
