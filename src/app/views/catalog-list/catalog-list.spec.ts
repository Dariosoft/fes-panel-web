import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PRODUCT_ORIGIN } from '../../core/constants/product-origin';
import { PRODUCT_STAGE } from '../../core/constants/product-stage';
import { CatalogProduct } from '../../core/models/catalog-product';
import { Catalog } from '../../core/services/catalog/catalog';
import { Session } from '../../core/services/session/session';
import { CatalogListView } from './catalog-list';

describe('CatalogListView', () => {
  let fixture: ComponentFixture<CatalogListView>;
  let authenticated: boolean;

  const buildProduct = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
    id: 'product-1',
    name: 'Mate',
    price: 1500,
    currency: 'ARS',
    stage: PRODUCT_STAGE.draft,
    owned: true,
    origin: PRODUCT_ORIGIN.server,
    images: [],
    createdAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  });

  const catalog = {
    loading: signal(false),
    error: signal<string | null>(null),
    filter: signal(''),
    localGroup: signal<CatalogProduct[]>([]),
    accountGroup: signal<CatalogProduct[]>([]),
    canPublishCatalog: signal(false),
    load: vi.fn(),
    setFilter: vi.fn(),
    publish: vi.fn(() => of(buildProduct({}))),
    unpublish: vi.fn(() => of(buildProduct({ stage: PRODUCT_STAGE.draft }))),
    remove: vi.fn(() => of(undefined)),
    publishCatalog: vi.fn(() => of(undefined)),
  };

  const createView = async (): Promise<void> => {
    fixture = TestBed.createComponent(CatalogListView);
    await fixture.whenStable();
  };

  const findButton = (label: string): HTMLButtonElement => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const found = buttons.find((button) => button.textContent?.trim() === label);
    if (!found) {
      throw new Error(`No se encontró el botón ${label}`);
    }
    return found;
  };

  beforeEach(() => {
    authenticated = false;
    catalog.loading.set(false);
    catalog.error.set(null);
    catalog.filter.set('');
    catalog.localGroup.set([]);
    catalog.accountGroup.set([]);
    catalog.canPublishCatalog.set(false);
    catalog.load.mockClear();
    catalog.setFilter.mockClear();
    catalog.publish.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: Session, useValue: { authenticated: () => authenticated } },
        { provide: Catalog, useValue: catalog },
      ],
    });
  });

  it('shows only local products without a session', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    const text = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(text).toContain('Mate');
    expect(catalog.load).toHaveBeenCalled();
  });

  it('shows the ownerless and account groups with a session', async () => {
    authenticated = true;
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    catalog.accountGroup.set([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published })]);
    await createView();

    const text = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('h2')).toBeNull();
    expect(text).toContain('Mate');
  });

  it('warns that local products can be lost when closing the page', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    expect(fixture.nativeElement.textContent).toContain('pueden perder');
  });

  it('does not warn when there are no local products', async () => {
    catalog.accountGroup.set([buildProduct({ id: 'server-1' })]);
    await createView();

    expect(fixture.nativeElement.textContent).not.toContain('pueden perder');
  });

  it('filters by name through the search input', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    const input = fixture.nativeElement.querySelector('#catalog-search') as HTMLInputElement;
    input.value = 'mat';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(catalog.setFilter).toHaveBeenCalledWith('mat');
  });

  it('disables publish without a session', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    expect(findButton('Publicar').getAttribute('aria-disabled')).toBe('true');
  });

  it('publishes only after confirming the dialog', async () => {
    authenticated = true;
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    catalog.publish.mockReturnValue(of(buildProduct({ id: 'server-1' })));
    await createView();

    findButton('Publicar').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(catalog.publish).not.toHaveBeenCalled();

    const dialogButtons = fixture.nativeElement.querySelectorAll('[role="dialog"] button');
    (dialogButtons[dialogButtons.length - 1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(catalog.publish).toHaveBeenCalled();
  });
});
