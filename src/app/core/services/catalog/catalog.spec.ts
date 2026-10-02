import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { CATALOG_STORAGE_KEYS } from '../../constants/catalog-storage-keys';
import { PRODUCT_ORIGIN } from '../../constants/product-origin';
import { PRODUCT_STAGE } from '../../constants/product-stage';
import { CatalogProduct } from '../../models/catalog-product';
import { Session } from '../session/session';
import { Catalog } from './catalog';
import { LocalCatalog } from './local-catalog';

describe('Catalog', () => {
  let catalog: Catalog;
  let localCatalog: LocalCatalog;
  let httpTesting: HttpTestingController;
  let authenticated: boolean;
  let enterWithGoogle: ReturnType<typeof vi.fn>;

  const productsUrl = `${environment.apiBaseUrl}/panel/catalog/products`;

  const buildProduct = (
    overrides: Partial<CatalogProduct> & { ownerAccountId?: string | null },
  ): CatalogProduct & { ownerAccountId: string | null } => {
    const owned = overrides.owned ?? true;
    return {
      id: 'product-1',
      name: 'Mate',
      price: 1500,
      currency: 'ARS',
      stage: PRODUCT_STAGE.draft,
      owned,
      origin: PRODUCT_ORIGIN.server,
      images: [],
      createdAt: '2026-10-01T12:00:00.000Z',
      ownerAccountId: owned ? 'account-1' : null,
      ...overrides,
    };
  };

  beforeEach(() => {
    sessionStorage.clear();
    authenticated = false;
    enterWithGoogle = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Session, useValue: { authenticated: () => authenticated, enterWithGoogle } },
      ],
    });
    catalog = TestBed.inject(Catalog);
    localCatalog = TestBed.inject(LocalCatalog);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  it('shows only local products without a session', () => {
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );

    catalog.load();

    expect(catalog.localGroup()).toHaveLength(1);
    expect(catalog.accountGroup()).toHaveLength(0);
  });

  it('shows local and account products with a session', () => {
    authenticated = true;
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );

    catalog.load();
    httpTesting.expectOne(productsUrl).flush([
      buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.draft }),
      buildProduct({ id: 'server-2', stage: PRODUCT_STAGE.published }),
    ]);

    expect(catalog.localGroup()).toHaveLength(1);
    expect(catalog.accountGroup()).toHaveLength(2);
  });

  it('orders products by creation date, newest first', () => {
    authenticated = true;

    catalog.load();
    httpTesting.expectOne(productsUrl).flush([
      buildProduct({ id: 'old', createdAt: '2026-09-01T12:00:00.000Z' }),
      buildProduct({ id: 'new', createdAt: '2026-10-01T12:00:00.000Z' }),
    ]);

    expect(catalog.accountGroup().map((product) => product.id)).toEqual(['new', 'old']);
  });

  it('filters by name without mutating the source list', () => {
    authenticated = true;

    catalog.load();
    httpTesting.expectOne(productsUrl).flush([
      buildProduct({ id: 'mate', name: 'Mate' }),
      buildProduct({ id: 'termo', name: 'Termo' }),
    ]);

    catalog.setFilter('mat');

    expect(catalog.accountGroup().map((product) => product.id)).toEqual(['mate']);
    catalog.setFilter('');
    expect(catalog.accountGroup()).toHaveLength(2);
  });

  it('saves locally without touching the network when there is no session', () => {
    catalog.save({ name: 'Mate', price: 1500, currency: 'ARS', images: [] }).subscribe();

    expect(catalog.localGroup()).toHaveLength(1);
    expect(catalog.localGroup()[0]).toMatchObject({
      name: 'Mate',
      origin: PRODUCT_ORIGIN.local,
      owned: false,
      stage: PRODUCT_STAGE.draft,
    });
  });

  it('creates a server draft with credentials when there is a session', () => {
    authenticated = true;

    let saved: CatalogProduct | undefined;
    catalog
      .save({ name: 'Mate', price: 1500, currency: 'ARS', images: [] })
      .subscribe((product) => (saved = product));

    const request = httpTesting.expectOne(productsUrl);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(buildProduct({ id: 'server-9', name: 'Mate' }));

    expect(saved?.id).toBe('server-9');
    expect(catalog.accountGroup().map((product) => product.id)).toEqual(['server-9']);
  });

  it('updates an existing server product with credentials', () => {
    authenticated = true;
    catalog.load();
    httpTesting
      .expectOne(productsUrl)
      .flush([buildProduct({ id: 'server-1', name: 'Mate' })]);

    catalog
      .save({ id: 'server-1', name: 'Mate imperial', price: 1800, currency: 'ARS', images: [] })
      .subscribe();

    const request = httpTesting.expectOne(`${productsUrl}/server-1`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.withCredentials).toBe(true);
    request.flush(buildProduct({ id: 'server-1', name: 'Mate imperial' }));

    expect(catalog.accountGroup()[0].name).toBe('Mate imperial');
  });

  it('keeps editing a local product locally even with a session', () => {
    authenticated = true;
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );
    catalog.load();
    httpTesting.expectOne(productsUrl).flush([]);

    catalog
      .save({ id: 'local-1', name: 'Mate editado', price: 900, currency: 'ARS', images: [] })
      .subscribe();

    expect(catalog.localGroup()[0].name).toBe('Mate editado');
  });

  it('shows an error and no account products when the server fails', () => {
    authenticated = true;

    catalog.load();
    httpTesting.expectOne(productsUrl).flush('error', { status: 503, statusText: 'Unavailable' });

    expect(catalog.accountGroup()).toHaveLength(0);
    expect(catalog.error()).toBe('No se pudieron cargar los productos de tu cuenta.');
    expect(catalog.loading()).toBe(false);
  });

  it('publishes a server draft', () => {
    authenticated = true;
    catalog.load();
    httpTesting
      .expectOne(productsUrl)
      .flush([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.draft })]);

    catalog.publish(catalog.accountGroup()[0]).subscribe();

    const request = httpTesting.expectOne(`${productsUrl}/server-1/publish`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published }));

    expect(catalog.accountGroup()[0].stage).toBe(PRODUCT_STAGE.published);
  });

  it('creates and publishes a local product without owner', () => {
    authenticated = true;
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );
    catalog.load();
    httpTesting.expectOne(productsUrl).flush([]);

    catalog.publish(catalog.localGroup()[0]).subscribe();

    const createRequest = httpTesting.expectOne(productsUrl);
    expect(createRequest.request.method).toBe('POST');
    createRequest.flush(buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.draft }));

    const publishRequest = httpTesting.expectOne(`${productsUrl}/server-1/publish`);
    publishRequest.flush(
      buildProduct({ id: 'server-1', owned: true, stage: PRODUCT_STAGE.published }),
    );

    expect(catalog.localGroup()).toHaveLength(0);
    expect(catalog.accountGroup()[0]).toMatchObject({ id: 'server-1', owned: true });
  });

  it('unpublishes an owned product', () => {
    authenticated = true;
    catalog.load();
    httpTesting
      .expectOne(productsUrl)
      .flush([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published })]);

    catalog.unpublish(catalog.accountGroup()[0]).subscribe();

    const request = httpTesting.expectOne(`${productsUrl}/server-1/unpublish`);
    expect(request.request.method).toBe('POST');
    request.flush(buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.draft }));

    expect(catalog.accountGroup()[0].stage).toBe(PRODUCT_STAGE.draft);
  });

  it('deletes an owned product on the server', () => {
    authenticated = true;
    catalog.load();
    httpTesting
      .expectOne(productsUrl)
      .flush([
        buildProduct({ id: 'server-1' }),
        buildProduct({ id: 'server-2', name: 'Termo' }),
      ]);

    catalog.remove(catalog.accountGroup().find((product) => product.id === 'server-1')!).subscribe();

    const request = httpTesting.expectOne(`${productsUrl}/server-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);

    expect(catalog.accountGroup().map((product) => product.id)).toEqual(['server-2']);
  });

  it('deletes a local product without using the network', () => {
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );
    catalog.load();

    catalog.remove(catalog.localGroup()[0]).subscribe();

    expect(catalog.localGroup()).toHaveLength(0);
  });

  it('publishes the whole catalog taking ownership of local drafts', () => {
    authenticated = true;
    localCatalog.upsert(
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    );
    catalog.load();
    httpTesting
      .expectOne(productsUrl)
      .flush([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.draft })]);

    catalog.publishCatalog().subscribe();

    httpTesting.expectOne(productsUrl).flush(buildProduct({ id: 'server-2' }));

    const publishRequest = httpTesting.expectOne(`${environment.apiBaseUrl}/panel/catalog/publish`);
    publishRequest.flush({ published: 2 });

    httpTesting
      .expectOne(productsUrl)
      .flush([
        buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published }),
        buildProduct({ id: 'server-2', stage: PRODUCT_STAGE.published }),
      ]);

    expect(catalog.localGroup()).toHaveLength(0);
    expect(catalog.accountGroup().every((product) => product.stage === PRODUCT_STAGE.published)).toBe(
      true,
    );
  });

  it('remembers a 401 and retries the operation once when the session returns', () => {
    authenticated = true;
    catalog
      .save({ name: 'Mate', price: 1500, currency: 'ARS', images: [] })
      .subscribe({ error: () => undefined });

    httpTesting.expectOne(productsUrl).flush('unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(enterWithGoogle).toHaveBeenCalled();
    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toContain('save');

    catalog.resumePending();
    const retry = httpTesting.expectOne(productsUrl);
    expect(retry.request.method).toBe('POST');
    retry.flush(buildProduct({ id: 'server-9' }));

    httpTesting.expectOne(productsUrl).flush([]);

    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toBeNull();
  });

  it('discards the pending operation when the retry fails again', () => {
    authenticated = true;
    catalog.publish(buildProduct({ id: 'server-1' })).subscribe({ error: () => undefined });

    httpTesting.expectOne(`${productsUrl}/server-1/publish`).flush('unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    catalog.resumePending();
    httpTesting.expectOne(`${productsUrl}/server-1/publish`).flush('unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
    });

    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toBeNull();
  });
});
