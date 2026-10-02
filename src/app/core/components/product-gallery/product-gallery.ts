import { Component, computed, input, signal } from '@angular/core';
import { ProductImage } from '../../models/catalog-product';

@Component({
  selector: 'app-product-gallery',
  standalone: true,
  templateUrl: './product-gallery.html',
})
export class ProductGallery {
  readonly images = input.required<ProductImage[]>();

  private readonly activeIndex = signal(0);

  readonly total = computed(() => this.images().length);
  readonly hasMany = computed(() => this.total() > 1);

  readonly current = computed(() => {
    const images = this.images();
    return images.length > 0 ? images[this.activeIndex() % images.length] : null;
  });

  readonly source = computed(() => {
    const image = this.current();
    return image?.url ?? image?.dataUrl ?? '';
  });

  readonly indexLabel = computed(() => {
    const total = this.total();
    return total > 0 ? `${(this.activeIndex() % total) + 1} / ${total}` : '';
  });

  next(): void {
    const total = this.total();
    if (total > 1) {
      this.activeIndex.update((index) => (index + 1) % total);
    }
  }

  previous(): void {
    const total = this.total();
    if (total > 1) {
      this.activeIndex.update((index) => (index - 1 + total) % total);
    }
  }
}
