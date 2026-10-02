import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductStatus } from './product-status';

describe('ProductStatus', () => {
  let fixture: ComponentFixture<ProductStatus>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProductStatus] });
    fixture = TestBed.createComponent(ProductStatus);
  });

  it('shows the draft stage', async () => {
    fixture.componentRef.setInput('stage', 'draft');

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Etapa: Borrador');
  });

  it('shows the published stage', async () => {
    fixture.componentRef.setInput('stage', 'published');

    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Etapa: Publicado');
  });
});
