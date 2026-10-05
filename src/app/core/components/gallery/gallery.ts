import { Component, effect, inject, input } from '@angular/core';
import { ImageItem } from '../../models/image-item';
import { ImageCarousel } from '../../services/media/image-carousel';

@Component({
  selector: 'app-gallery',
  standalone: true,
  templateUrl: './gallery.html',
  host: { class: 'flex shrink-0' },
  providers: [ImageCarousel],
})
export class Gallery {
  private readonly carousel = inject(ImageCarousel);

  readonly images = input.required<ImageItem[]>();
  readonly alt = input('');
  readonly source = this.carousel.source;
  readonly hasMany = this.carousel.hasMany;
  readonly indexLabel = this.carousel.indexLabel;

  constructor() {
    effect(() => this.carousel.setImages(this.images()));
  }

  next(): void {
    this.carousel.next();
  }

  previous(): void {
    this.carousel.previous();
  }
}
