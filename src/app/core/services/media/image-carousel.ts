import { Injectable, computed, signal } from '@angular/core';
import { ImageItem } from '../../models/image-item';

@Injectable()
export class ImageCarousel {
  readonly items = signal<ImageItem[]>([]);
  readonly activeIndex = signal(0);

  readonly current = computed(() => this.items()[this.activeIndex()] ?? null);
  readonly source = computed(() => {
    const item = this.current();
    return item?.url ?? item?.dataUrl ?? '';
  });
  readonly total = computed(() => this.items().length);
  readonly hasMany = computed(() => this.total() > 1);
  readonly indexLabel = computed(() =>
    this.total() > 0 ? `${this.activeIndex() + 1} / ${this.total()}` : '',
  );

  setImages(images: ImageItem[]): void {
    this.items.set(images);
    if (this.activeIndex() >= images.length) {
      this.activeIndex.set(0);
    }
  }

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
