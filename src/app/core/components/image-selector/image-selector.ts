import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ImageItem } from '../../models/image-item';
import { ImageCarousel } from '../../services/media/image-carousel';

let nextInputId = 0;

@Component({
  selector: 'app-image-selector',
  standalone: true,
  templateUrl: './image-selector.html',
  providers: [ImageCarousel],
})
export class ImageSelector {
  private readonly carousel = inject(ImageCarousel);

  readonly images = input<ImageItem[]>([]);
  readonly maxImages = input.required<number>();
  readonly maxImageBytes = input.required<number>();
  readonly label = input('Imágenes');
  readonly helperText = input('');
  readonly limitExceededMessage = input<string>();
  readonly accept = input('image/*');
  readonly inputId = input(`image-selector-${++nextInputId}`);
  readonly imagesChange = output<ImageItem[]>();

  readonly errorMessage = signal<string | null>(null);
  readonly current = this.carousel.current;
  readonly source = this.carousel.source;
  readonly indexLabel = this.carousel.indexLabel;

  constructor() {
    effect(() => this.carousel.setImages(this.images()));
  }

  async onFilesSelected(event: Event): Promise<void> {
    const inputElement = event.target as HTMLInputElement;
    const files = Array.from(inputElement.files ?? []);
    inputElement.value = '';
    if (files.length === 0) {
      return;
    }

    const oversized = files.filter((file) => file.size > this.maxImageBytes());
    const valid = files.filter((file) => file.size <= this.maxImageBytes());
    const available = Math.max(0, this.maxImages() - this.images().length);
    const withinLimit = valid.slice(0, available);

    this.errorMessage.set(this.buildWarning(oversized.length, valid.length - withinLimit.length));

    if (withinLimit.length === 0) {
      return;
    }

    const images = await Promise.all(withinLimit.map((file) => this.toImage(file)));
    this.imagesChange.emit([...this.images(), ...images]);
  }

  removeCurrent(): void {
    const image = this.current();
    if (image) {
      this.imagesChange.emit(this.images().filter((candidate) => candidate.id !== image.id));
    }
  }

  next(): void {
    this.carousel.next();
  }

  previous(): void {
    this.carousel.previous();
  }

  onCarouselKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
  }

  private buildWarning(oversized: number, excess: number): string | null {
    const messages: string[] = [];
    if (oversized > 0) {
      messages.push(
        `Se rechazaron ${oversized} imágenes por superar ${this.formatBytes(this.maxImageBytes())} cada una.`,
      );
    }
    if (excess > 0) {
      messages.push(
        this.limitExceededMessage() ??
          `Se rechazaron ${excess} imágenes por superar el límite de ${this.maxImages()}.`,
      );
    }
    return messages.length > 0 ? messages.join(' ') : null;
  }

  private formatBytes(bytes: number): string {
    if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) {
      return `${bytes / (1024 * 1024)} MB`;
    }
    if (bytes >= 1024 && bytes % 1024 === 0) {
      return `${bytes / 1024} KB`;
    }
    return `${bytes} bytes`;
  }

  private async toImage(file: File): Promise<ImageItem> {
    const dataUrl = await this.readAsDataUrl(file);
    return {
      id: `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      dataUrl,
      file,
    };
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
