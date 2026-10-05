import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageItem } from '../../models/image-item';
import { ImageSelector } from './image-selector';

describe('ImageSelector', () => {
  let fixture: ComponentFixture<ImageSelector>;

  const selectFiles = async (files: File[]): Promise<void> => {
    const event = { target: { files, value: '' } } as unknown as Event;
    await fixture.componentInstance.onFilesSelected(event);
  };

  const image = (id: string): ImageItem => ({
    id,
    name: `${id}.png`,
    dataUrl: `data:image/png;base64,${id}`,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ImageSelector] });
    fixture = TestBed.createComponent(ImageSelector);
    fixture.componentRef.setInput('maxImages', 10);
    fixture.componentRef.setInput('maxImageBytes', 2 * 1024 * 1024);
  });

  it('shows a placeholder and associates its generated input id with the label', async () => {
    await fixture.whenStable();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(fixture.nativeElement.textContent).toContain('Todavía no hay imágenes.');
    expect(input.id).not.toBe('');
    expect(label.htmlFor).toBe(input.id);
  });

  it('shows a carousel with controls when there are images', async () => {
    fixture.componentRef.setInput('images', [image('one')]);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('1 / 1');
    expect(fixture.nativeElement.querySelector('[aria-label="Imagen siguiente"]')).not.toBeNull();
  });

  it('accepts files within the configured count and size', async () => {
    const emitted: ImageItem[][] = [];
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

  it('uses the supplied message when the count limit is exceeded', async () => {
    fixture.componentRef.setInput('maxImages', 1);
    fixture.componentRef.setInput('limitExceededMessage', 'Ingresá para agregar más imágenes.');
    const emitted: ImageItem[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));

    await selectFiles([
      new File(['a'], 'first.png', { type: 'image/png' }),
      new File(['b'], 'second.png', { type: 'image/png' }),
    ]);

    expect(emitted[0]).toHaveLength(1);
    expect(fixture.componentInstance.errorMessage()).toBe('Ingresá para agregar más imágenes.');
  });

  it('rejects an image over the configured size', async () => {
    const emitted: ImageItem[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));

    await selectFiles([
      new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
    ]);

    expect(emitted).toHaveLength(0);
    expect(fixture.componentInstance.errorMessage()).toContain('2 MB');
  });

  it('navigates with the arrow keys and removes the current image', async () => {
    fixture.componentRef.setInput('images', [image('one'), image('two')]);
    const emitted: ImageItem[][] = [];
    fixture.componentInstance.imagesChange.subscribe((images) => emitted.push(images));
    await fixture.whenStable();

    const carousel = fixture.nativeElement.querySelector('[role="group"]') as HTMLElement;
    carousel.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    await fixture.whenStable();
    expect((fixture.nativeElement.querySelector('img') as HTMLImageElement).alt).toBe('two.png');

    (fixture.nativeElement.querySelectorAll('button')[2] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(emitted[0].map((item) => item.id)).toEqual(['one']);
  });
});
