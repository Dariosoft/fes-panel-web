import { Component, computed, input, output, signal } from '@angular/core';
import {
  MAX_IMAGES,
  MAX_IMAGES_WITHOUT_SESSION,
  MAX_IMAGE_BYTES,
} from '../../constants/product-limits';
import { ProductImage } from '../../models/catalog-product';

@Component({
  selector: 'app-product-images',
  standalone: true,
  templateUrl: './product-images.html',
})
export class ProductImages {
  readonly images = input<ProductImage[]>([]);
  readonly authenticated = input(false);
  readonly imagesChange = output<ProductImage[]>();

  readonly errorMessage = signal<string | null>(null);
  private readonly activeIndex = signal(0);

  readonly currentImage = computed(() => {
    const images = this.images();
    if (images.length === 0) {
      return null;
    }
    return images[this.activeIndex() % images.length];
  });

  readonly indexLabel = computed(() => {
    const total = this.images().length;
    if (total === 0) {
      return '';
    }
    return `${(this.activeIndex() % total) + 1} / ${total}`;
  });

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }

    const oversized = files.filter((file) => file.size > MAX_IMAGE_BYTES);
    const valid = files.filter((file) => file.size <= MAX_IMAGE_BYTES);
    const limit = this.authenticated() ? MAX_IMAGES : MAX_IMAGES_WITHOUT_SESSION;
    const available = Math.max(0, limit - this.images().length);
    const withinLimit = valid.slice(0, available);

    this.errorMessage.set(this.buildWarning(oversized.length, valid.length - withinLimit.length));

    if (withinLimit.length === 0) {
      return;
    }

    const images = await Promise.all(withinLimit.map((file) => this.toImage(file)));
    this.imagesChange.emit([...this.images(), ...images]);
  }

  removeCurrent(): void {
    const image = this.currentImage();
    if (image) {
      this.imagesChange.emit(this.images().filter((candidate) => candidate.id !== image.id));
    }
  }

  next(): void {
    const total = this.images().length;
    if (total > 0) {
      this.activeIndex.update((index) => (index + 1) % total);
    }
  }

  previous(): void {
    const total = this.images().length;
    if (total > 0) {
      this.activeIndex.update((index) => (index - 1 + total) % total);
    }
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
      messages.push(`Se rechazaron ${oversized} imágenes por superar 2 MB cada una.`);
    }
    if (excess > 0) {
      messages.push(
        this.authenticated()
          ? `Se rechazaron ${excess} imágenes por superar el límite de 10.`
          : 'Sin sesión podés adjuntar solo 1 imagen. Iniciá sesión para adjuntar hasta 10.',
      );
    }
    return messages.length > 0 ? messages.join(' ') : null;
  }

  private async toImage(file: File): Promise<ProductImage> {
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
