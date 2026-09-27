import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Session } from '../../core/session/session';
import { Shell } from './shell';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Shell],
      providers: [
        {
          provide: Session,
          useValue: {
            authenticated: signal(false),
            profile: signal(null),
            notice: signal(null),
            enterWithGoogle: () => undefined,
            logout: () => undefined,
          },
        },
      ],
    });
    fixture = TestBed.createComponent(Shell);
  });

  it('shows the seller panel and the optional Google entry', async () => {
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Tu tienda empieza acá.');
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Entrar con Google');
  });
});
