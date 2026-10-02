import { TestBed } from '@angular/core/testing';
import { CATALOG_STORAGE_KEYS } from '../../constants/catalog-storage-keys';
import { PRODUCT_ORIGIN } from '../../constants/product-origin';
import { PRODUCT_STAGE } from '../../constants/product-stage';
import { CatalogProduct } from '../../models/catalog-product';
import { LocalCatalog } from './local-catalog';

describe('LocalCatalog', () => {
  let localCatalog: LocalCatalog;

  const product: CatalogProduct = {
    id: 'local-1',
    name: 'Mate',
    price: 1500,
    currency: 'ARS',
    stock: 3,
    stage: PRODUCT_STAGE.draft,
    owned: false,
    origin: PRODUCT_ORIGIN.local,
    images: [],
    createdAt: '2026-10-01T12:00:00.000Z',
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    localCatalog = TestBed.inject(LocalCatalog);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('stores and reads local products from sessionStorage only', () => {
    localCatalog.upsert(product);

    expect(localCatalog.list()).toEqual([product]);
    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.localProducts)).toContain('local-1');
    expect(localStorage.getItem(CATALOG_STORAGE_KEYS.localProducts)).toBeNull();
  });

  it('updates an existing local product without duplicating it', () => {
    localCatalog.upsert(product);
    localCatalog.upsert({ ...product, name: 'Mate imperial' });

    const products = localCatalog.list();
    expect(products).toHaveLength(1);
    expect(products[0].name).toBe('Mate imperial');
  });

  it('removes a local product', () => {
    localCatalog.upsert(product);
    localCatalog.remove('local-1');

    expect(localCatalog.list()).toEqual([]);
  });

  it('ignores corrupted stored data', () => {
    sessionStorage.setItem(CATALOG_STORAGE_KEYS.localProducts, '{not-json');

    expect(localCatalog.list()).toEqual([]);
    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.localProducts)).toBeNull();
  });
});
