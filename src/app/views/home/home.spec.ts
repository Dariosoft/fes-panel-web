import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeView } from './home';

describe('HomeView', () => {
  let fixture: ComponentFixture<HomeView>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HomeView],
    });
    fixture = TestBed.createComponent(HomeView);
  });

  it('shows the seller panel home content without app chrome', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Tu tienda empieza acá.');
    expect(fixture.nativeElement.querySelector('aside')).toBeNull();
  });
});
