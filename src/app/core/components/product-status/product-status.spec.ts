import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductStatus } from './product-status';

describe('ProductStatus', () => {
  let fixture: ComponentFixture<ProductStatus>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProductStatus] });
    fixture = TestBed.createComponent(ProductStatus);
  });

  it('shows the draft stage and owner state', async () => {
    fixture.componentRef.setInput('stage', 'draft');
    fixture.componentRef.setInput('owned', true);

    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Etapa: Borrador');
    expect(text).toContain('De tu cuenta');
  });

  it('shows the published stage and no-owner state', async () => {
    fixture.componentRef.setInput('stage', 'published');
    fixture.componentRef.setInput('owned', false);

    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Etapa: Publicado');
    expect(text).toContain('Sin dueño');
  });
});
