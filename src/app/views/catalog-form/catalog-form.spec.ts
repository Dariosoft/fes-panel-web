import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PRODUCT_ORIGIN } from '../../core/constants/product-origin';
import { PRODUCT_STAGE } from '../../core/constants/product-stage';
import { CatalogProduct } from '../../core/models/catalog-product';
import { Catalog } from '../../core/services/catalog/catalog';
import { Session } from '../../core/services/session/session';
import { CatalogFormView } from './catalog-form';

describe('CatalogFormView', () => {
  let fixture: ComponentFixture<CatalogFormView>;
  let catalog: {
    getProduct: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let navigate: ReturnType<typeof vi.fn>;

  const buildProduct = (overrides: Partial<CatalogProduct>): CatalogProduct => ({
    id: 'product-1',
    name: 'Mate',
    price: 1500,
    currency: 'ARS',
    stage: PRODUCT_STAGE.draft,
    owned: false,
    origin: PRODUCT_ORIGIN.local,
    images: [],
    createdAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  });

  const configure = async (id: string | null): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
        { provide: Session, useValue: { authenticated: () => false } },
        { provide: Catalog, useValue: catalog },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(CatalogFormView);
    await fixture.whenStable();
  };

  beforeEach(() => {
    catalog = {
      getProduct: vi.fn(() => of(undefined)),
      save: vi.fn(() => of(buildProduct({}))),
    };
  });

  it('starts with ARS and an empty optional stock', async () => {
    await configure(null);

    expect(fixture.componentInstance.form.value.currency).toBe('ARS');
    expect(fixture.componentInstance.form.value.stock).toBeNull();
    expect(fixture.componentInstance.heading).toBe('Nuevo producto');
  });

  it('shows a field error and does not save when the form is invalid', async () => {
    await configure(null);

    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Ingresá un nombre para el producto.');
    expect(catalog.save).not.toHaveBeenCalled();
  });

  it('saves without a session and navigates back to the catalog', async () => {
    await configure(null);

    fixture.componentInstance.form.patchValue({ name: 'Mate', price: 1500 });
    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(catalog.save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Mate', price: 1500, currency: 'ARS' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/catalog']);
  });

  it('sends undefined stock when the optional field is empty', async () => {
    await configure(null);

    fixture.componentInstance.form.patchValue({ name: 'Mate', price: 1500, stock: null });
    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(catalog.save.mock.calls[0][0].stock).toBeUndefined();
  });

  it('loads the product into the form when editing', async () => {
    catalog.getProduct = vi.fn(() =>
      of(buildProduct({ id: 'local-1', name: 'Mate imperial', price: 1800, stock: 4 })),
    );
    await configure('local-1');

    expect(fixture.componentInstance.heading).toBe('Editar producto');
    expect(fixture.componentInstance.form.value.name).toBe('Mate imperial');
    expect(fixture.componentInstance.form.value.price).toBe(1800);
    expect(fixture.componentInstance.form.value.stock).toBe(4);
  });

  it('shows an error when the product to edit does not exist', async () => {
    await configure('missing');

    expect(fixture.nativeElement.textContent).toContain('No encontramos el producto');
  });
});
