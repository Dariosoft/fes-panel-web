import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductImage } from '../../models/catalog-product';
import { ProductImages } from './product-images';

describe('ProductImages', () => {
  let fixture: ComponentFixture<ProductImages>;

  const selectFiles = async (files: File[]): Promise<void> => {
    const event = { target: { files, value: '' } } as unknown as Event;
    await fixture.componentInstance.onFilesSelected(event);
  };

  const image = (id: string): ProductImage => ({
    id,
    name: `${id}.png`,
    dataUrl: `data:image/png;base64,${id}`,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ProductImages] });
    fixture = TestBed.createComponent(ProductImages);
  });

  it('shows a placeholder when there are no images', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Todavía no hay imágenes.');
  });

  it('shows a carousel with controls when there are images', async () => {
    fixture.componentRef.setInput('images', [image('one')]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('1 / 1');
    expect(fixture.nativeElement.querySelector('[aria-label="Imagen siguiente"]')).not.toBeNull();
  });

  it('accepts ten images with a session', async () => {
    fixture.componentRef.setInput('authenticated', true);
    const emitted: ProductImage[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));

    const files = Array.from(
      { length: 10 },
      (_, index) => new File(['a'], `image-${index}.png`, { type: 'image/png' }),
    );
    await selectFiles(files);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(10);
    expect(fixture.componentInstance.errorMessage()).toBeNull();
  });

  it('rejects a second image without a session and warns about logging in', async () => {
    const emitted: ProductImage[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));

    await selectFiles([
      new File(['a'], 'first.png', { type: 'image/png' }),
      new File(['b'], 'second.png', { type: 'image/png' }),
    ]);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toHaveLength(1);
    expect(fixture.componentInstance.errorMessage()).toContain('Iniciá sesión');
  });

  it('rejects an image over two megabytes', async () => {
    fixture.componentRef.setInput('authenticated', true);
    const emitted: ProductImage[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));

    await selectFiles([
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    ]);

    expect(emitted).toHaveLength(0);
    expect(fixture.componentInstance.errorMessage()).toContain('2 MB');
  });
});
