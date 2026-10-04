import { TestBed } from '@angular/core/testing';
import { ImageCarousel } from './image-carousel';

describe('ImageCarousel', () => {
  let carousel: ImageCarousel;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ImageCarousel] });
    carousel = TestBed.inject(ImageCarousel);
  });

  it('exposes the current item and its preferred source', () => {
    carousel.setImages([
      { id: 'one', dataUrl: 'data:one' },
      { id: 'two', url: 'https://example/two.png', dataUrl: 'data:two' },
    ]);

    expect(carousel.current()?.id).toBe('one');
    expect(carousel.source()).toBe('data:one');
    expect(carousel.total()).toBe(2);
    expect(carousel.hasMany()).toBe(true);
    expect(carousel.indexLabel()).toBe('1 / 2');

    carousel.next();

    expect(carousel.current()?.id).toBe('two');
    expect(carousel.source()).toBe('https://example/two.png');
    expect(carousel.indexLabel()).toBe('2 / 2');
  });

  it('wraps in both directions', () => {
    carousel.setImages([{ id: 'one' }, { id: 'two' }]);

    carousel.previous();
    expect(carousel.current()?.id).toBe('two');

    carousel.next();
    expect(carousel.current()?.id).toBe('one');
  });

  it('resets the index when new items leave it out of range', () => {
    carousel.setImages([{ id: 'one' }, { id: 'two' }]);
    carousel.next();

    carousel.setImages([{ id: 'one' }]);

    expect(carousel.activeIndex()).toBe(0);
    expect(carousel.current()?.id).toBe('one');
  });
});
