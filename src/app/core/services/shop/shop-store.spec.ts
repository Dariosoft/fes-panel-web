import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { Shop } from '../../models/shop';
import { PanelShop } from './panel-shop';
import { SHOP_LOAD_ERROR_MESSAGE, SHOP_SAVE_ERROR_MESSAGE, ShopStore } from './shop-store';

describe('ShopStore', () => {
  let store: ShopStore;
  let panelShop: {
    get: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  const shop: Shop = { name: 'Mi tienda', description: 'Productos artesanales' };

  beforeEach(() => {
    panelShop = { get: vi.fn(), save: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: PanelShop, useValue: panelShop }],
    });
    store = TestBed.inject(ShopStore);
  });

  it('loads the shop and clears the loading state', () => {
    const response = new Subject<Shop | null>();
    panelShop.get.mockReturnValue(response.asObservable());

    store.load();
    expect(store.loading()).toBe(true);
    expect(store.loadError()).toBeNull();

    response.next(shop);
    response.complete();

    expect(store.loading()).toBe(false);
    expect(store.shop()).toEqual(shop);
    expect(store.notFound()).toBe(false);
  });

  it('marks the shop as not found when the API returns no shop', () => {
    panelShop.get.mockReturnValue(of(null));

    store.load();

    expect(store.notFound()).toBe(true);
    expect(store.shop()).toBeNull();
    expect(store.loadError()).toBeNull();
    expect(store.loading()).toBe(false);
  });

  it('reports a load error and retries', () => {
    panelShop.get.mockReturnValueOnce(throwError(() => new Error('boom')));

    store.load();

    expect(store.loadError()).toBe(SHOP_LOAD_ERROR_MESSAGE);
    expect(store.loading()).toBe(false);

    panelShop.get.mockReturnValueOnce(of(shop));
    store.retry();

    expect(store.loadError()).toBeNull();
    expect(store.shop()).toEqual(shop);
  });

  it('saves the shop and marks it as saved', () => {
    const response = new Subject<Shop>();
    panelShop.save.mockReturnValue(response.asObservable());
    let emitted: Shop | undefined;

    store.save(shop).subscribe((saved) => (emitted = saved));
    expect(store.saving()).toBe(true);

    response.next(shop);
    response.complete();

    expect(panelShop.save).toHaveBeenCalledWith(shop);
    expect(store.saving()).toBe(false);
    expect(store.saved()).toBe(true);
    expect(store.shop()).toEqual(shop);
    expect(emitted).toEqual(shop);
  });

  it('keeps the loaded shop and reports an error when saving fails', () => {
    panelShop.get.mockReturnValue(of(shop));
    store.load();

    panelShop.save.mockReturnValue(throwError(() => new Error('boom')));
    let errored = false;

    store
      .save({ name: 'Otra tienda', description: null })
      .subscribe({ error: () => (errored = true) });

    expect(errored).toBe(true);
    expect(store.saving()).toBe(false);
    expect(store.saveError()).toBe(SHOP_SAVE_ERROR_MESSAGE);
    expect(store.saved()).toBe(false);
    expect(store.shop()).toEqual(shop);
  });
});
