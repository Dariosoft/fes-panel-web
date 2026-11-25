import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  ParamMap,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';
import { PRODUCT_ORIGIN } from '../../core/constants/product-origin';
import { PRODUCT_STAGE } from '../../core/constants/product-stage';
import { CatalogProduct } from '../../core/models/catalog-product';
import { Catalog } from '../../core/services/catalog/catalog';
import { Session } from '../../core/services/session/session';
import { CatalogListView } from './catalog-list';

describe('CatalogListView', () => {
  let fixture: ComponentFixture<CatalogListView>;
  let authenticated: boolean;
  let activatedRoute: { snapshot: { queryParamMap: ParamMap } };

  const buildProduct = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
    id: 'product-1',
    name: 'Mate',
    price: 1500,
    currency: 'ARS',
    description: null,
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
    applyFilter: vi.fn(),
    clearFilters: vi.fn(),
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
    const found = buttons.find(
      (button) =>
        button.textContent?.trim() === label || button.getAttribute('aria-label') === label,
    );
    if (!found) {
      throw new Error(`No se encontró el botón ${label}`);
    }
    return found;
  };

  beforeEach(() => {
    authenticated = false;
    activatedRoute = { snapshot: { queryParamMap: convertToParamMap({}) } };
    catalog.loading.set(false);
    catalog.error.set(null);
    catalog.filter.set('');
    catalog.localGroup.set([]);
    catalog.accountGroup.set([]);
    catalog.canPublishCatalog.set(false);
    catalog.load.mockClear();
    catalog.applyFilter.mockClear();
    catalog.clearFilters.mockClear();
    catalog.publish.mockClear();
    catalog.unpublish.mockClear();
    catalog.remove.mockClear();
    catalog.publishCatalog.mockClear();

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: activatedRoute },
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

  it('applies the configured filters only through the button', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    const input = fixture.nativeElement.querySelector('#catalog-search') as HTMLInputElement;
    input.value = 'mat';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(catalog.applyFilter).not.toHaveBeenCalled();

    findButton('Aplicar filtros').click();
    await fixture.whenStable();

    expect(catalog.applyFilter).toHaveBeenCalledWith('mat');
  });

  it('clears every filter through the button', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    findButton('Eliminar filtros').click();
    await fixture.whenStable();

    expect(catalog.clearFilters).toHaveBeenCalled();
  });

  it('disables publish without a session', async () => {
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    await createView();

    const publish = findButton('Publicar');
    expect(publish.getAttribute('aria-disabled')).toBe('true');

    publish.click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('does not unpublish without a session', async () => {
    catalog.accountGroup.set([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published })]);
    await createView();

    findButton('Despublicar').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(catalog.unpublish).not.toHaveBeenCalled();
  });

  it('unpublishes only after confirming the dialog', async () => {
    authenticated = true;
    catalog.accountGroup.set([buildProduct({ id: 'server-1', stage: PRODUCT_STAGE.published })]);
    await createView();

    findButton('Despublicar').click();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('¿Querés despublicar');

    const dialogButtons = dialog.querySelectorAll('button');
    (dialogButtons[dialogButtons.length - 1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(catalog.unpublish).toHaveBeenCalled();
  });

  it('does not delete a server product without a session', async () => {
    catalog.accountGroup.set([buildProduct({ id: 'server-1' })]);
    await createView();

    findButton('Eliminar').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(catalog.remove).not.toHaveBeenCalled();
  });

  it('deletes only after confirming the dialog', async () => {
    authenticated = true;
    catalog.accountGroup.set([buildProduct({ id: 'server-1' })]);
    await createView();

    findButton('Eliminar').click();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Esta acción no se puede deshacer');

    const dialogButtons = dialog.querySelectorAll('button');
    (dialogButtons[dialogButtons.length - 1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(catalog.remove).toHaveBeenCalled();
  });

  it('does not publish the catalog when there are no drafts', async () => {
    authenticated = true;
    await createView();

    findButton('Publicar catálogo').click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(catalog.publishCatalog).not.toHaveBeenCalled();
  });

  it('publishes the catalog only after confirming the dialog', async () => {
    authenticated = true;
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    catalog.canPublishCatalog.set(true);
    await createView();

    findButton('Publicar catálogo').click();
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.textContent).toContain('Se publicarán');

    const dialogButtons = dialog.querySelectorAll('button');
    (dialogButtons[dialogButtons.length - 1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(catalog.publishCatalog).toHaveBeenCalled();
  });

  it('shows an error when a confirmed action fails', async () => {
    authenticated = true;
    catalog.localGroup.set([
      buildProduct({ id: 'local-1', origin: PRODUCT_ORIGIN.local, owned: false }),
    ]);
    catalog.publish.mockReturnValue(throwError(() => new Error('boom')));
    await createView();

    findButton('Publicar').click();
    await fixture.whenStable();

    const dialogButtons = fixture.nativeElement.querySelectorAll('[role="dialog"] button');
    (dialogButtons[dialogButtons.length - 1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No se pudo publicar el producto.');
  });

  it('ignores a confirmation without a pending action', async () => {
    await createView();

    fixture.componentInstance.confirmAction();

    expect(catalog.publish).not.toHaveBeenCalled();
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

  it('shows a success notice for a saved product and clears the query parameter', async () => {
    activatedRoute.snapshot = {
      queryParamMap: convertToParamMap({ guardado: 'producto' }),
    };
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    await createView();

    expect(fixture.nativeElement.textContent).toContain('Producto guardado.');
    expect(navigate).toHaveBeenCalledWith([], {
      queryParams: { guardado: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });
});
