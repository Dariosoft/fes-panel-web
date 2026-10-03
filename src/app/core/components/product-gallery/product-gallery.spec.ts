import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductGallery } from './product-gallery';

describe('ProductGallery', () => {
  let fixture: ComponentFixture<ProductGallery>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProductGallery] });
    fixture = TestBed.createComponent(ProductGallery);
  });

  it('shows the first image and cycles through the rest', async () => {
    fixture.componentRef.setInput('images', [
      { id: 'a', url: 'https://example/a.png' },
      { id: 'b', url: 'https://example/b.png' },
    ]);
    await fixture.whenStable();

    const image = (): HTMLImageElement => fixture.nativeElement.querySelector('img');
    expect(image().getAttribute('src')).toBe('https://example/a.png');

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(image().getAttribute('src')).toBe('https://example/b.png');
  });

  it('hides the controls with a single image and uses the data url', async () => {
    fixture.componentRef.setInput('images', [{ id: 'a', dataUrl: 'data:image/png;base64,AAA' }]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelectorAll('button')).toHaveLength(0);
    expect((fixture.nativeElement.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe(
      'data:image/png;base64,AAA',
    );
  });
});
