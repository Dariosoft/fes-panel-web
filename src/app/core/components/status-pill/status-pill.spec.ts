import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusPill } from './status-pill';

describe('StatusPill', () => {
  let fixture: ComponentFixture<StatusPill>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusPill] });
    fixture = TestBed.createComponent(StatusPill);
  });

  it('shows the supplied label with the muted tone by default', async () => {
    fixture.componentRef.setInput('label', 'Pendiente');

    await fixture.whenStable();

    const pill = fixture.nativeElement.querySelector('span');
    expect(pill.textContent).toContain('Pendiente');
    expect(pill.classList).toContain('text-muted-foreground');
  });

  it('applies the requested tone', async () => {
    fixture.componentRef.setInput('label', 'Error');
    fixture.componentRef.setInput('tone', 'destructive');

    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('span').classList).toContain('text-destructive');
  });
});
