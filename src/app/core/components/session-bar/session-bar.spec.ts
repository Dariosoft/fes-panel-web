import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SessionBar } from './session-bar';

describe('SessionBar', () => {
  let fixture: ComponentFixture<SessionBar>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SessionBar],
    });
    fixture = TestBed.createComponent(SessionBar);
  });

  it('offers Google entry while there is no session', async () => {
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button');
    expect(button.textContent).toContain('Entrar con Google');
    expect(fixture.nativeElement.textContent).not.toContain('Salir');
  });

  it('shows the person and logout while a session is open', async () => {
    fixture.componentRef.setInput('authenticated', true);
    fixture.componentRef.setInput('name', 'Ada Lovelace');
    fixture.componentRef.setInput('email', 'ada@example.com');

    await fixture.whenStable();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada@example.com');
    expect(text).toContain('Salir');
    expect(text).not.toContain('Entrar con Google');
  });

  it('shows a notice when entry or logout fails', async () => {
    fixture.componentRef.setInput('notice', 'No se pudo entrar.');

    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('No se pudo entrar.');
  });
});
