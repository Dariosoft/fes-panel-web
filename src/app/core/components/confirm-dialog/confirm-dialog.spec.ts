import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  let fixture: ComponentFixture<ConfirmDialog>;

  const open = async (): Promise<void> => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
  };

  const closes = async (): Promise<void> => {
    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });
    fixture = TestBed.createComponent(ConfirmDialog);
  });

  it('exposes an accessible modal dialog when open', async () => {
    fixture.componentRef.setInput('title', 'Eliminar producto');
    fixture.componentRef.setInput('message', 'Esta acción no se puede deshacer.');
    await open();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).not.toBeNull();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.textContent).toContain('Eliminar producto');
    expect(dialog.textContent).toContain('Esta acción no se puede deshacer.');
  });

  it('does not confirm when cancelled with the button', async () => {
    await open();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[0] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(confirmed).not.toHaveBeenCalled();
  });

  it('cancels with Escape', async () => {
    await open();
    const cancelled = vi.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await fixture.whenStable();

    expect(cancelled).toHaveBeenCalled();
  });

  it('confirms with the primary action button', async () => {
    await open();
    const confirmed = vi.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(confirmed).toHaveBeenCalled();
  });

  it('keeps focus inside the dialog and restores it on close', async () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();

    await open();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.contains(document.activeElement)).toBe(true);

    await closes();

    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
