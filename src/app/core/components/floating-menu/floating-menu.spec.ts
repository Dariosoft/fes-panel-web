import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Eye, Plus } from 'lucide-angular';
import { FloatingMenu } from './floating-menu';

describe('FloatingMenu', () => {
  let fixture: ComponentFixture<FloatingMenu>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [FloatingMenu] });
    fixture = TestBed.createComponent(FloatingMenu);
  });

  const mainButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[aria-expanded]');
  const itemButtons = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('#floating-menu-items button'));
  const panel = (): HTMLElement => fixture.nativeElement.querySelector('#floating-menu-items');

  it('starts collapsed and hides its items from assistive tech', async () => {
    fixture.componentRef.setInput('items', [
      { id: 'new', label: 'Nuevo producto', icon: Plus, action: vi.fn() },
    ]);
    await fixture.whenStable();

    expect(mainButton().getAttribute('aria-expanded')).toBe('false');
    expect(panel().getAttribute('aria-hidden')).toBe('true');
    expect(panel().hasAttribute('inert')).toBe(true);
  });

  it('reveals the configured items when the trigger is activated', async () => {
    fixture.componentRef.setInput('items', [
      { id: 'new', label: 'Nuevo producto', icon: Plus, action: vi.fn() },
    ]);
    await fixture.whenStable();

    mainButton().click();
    await fixture.whenStable();

    expect(mainButton().getAttribute('aria-expanded')).toBe('true');
    expect(panel().getAttribute('aria-hidden')).toBe('false');
    expect(panel().textContent).toContain('Nuevo producto');
  });

  it('runs the item action and closes when an item is chosen', async () => {
    const action = vi.fn();
    fixture.componentRef.setInput('items', [
      { id: 'new', label: 'Nuevo producto', icon: Plus, action },
    ]);
    await fixture.whenStable();

    mainButton().click();
    await fixture.whenStable();
    itemButtons()[0].click();
    await fixture.whenStable();

    expect(action).toHaveBeenCalledOnce();
    expect(mainButton().getAttribute('aria-expanded')).toBe('false');
  });

  it('ignores disabled items', async () => {
    const action = vi.fn();
    fixture.componentRef.setInput('items', [
      { id: 'publish', label: 'Publicar', icon: Eye, action, disabled: true },
    ]);
    await fixture.whenStable();

    mainButton().click();
    await fixture.whenStable();
    itemButtons()[0].click();
    await fixture.whenStable();

    expect(action).not.toHaveBeenCalled();
    expect(mainButton().getAttribute('aria-expanded')).toBe('true');
  });

  it('closes when Escape is pressed', async () => {
    fixture.componentRef.setInput('items', [
      { id: 'new', label: 'Nuevo producto', icon: Plus, action: vi.fn() },
    ]);
    await fixture.whenStable();

    mainButton().click();
    await fixture.whenStable();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(mainButton().getAttribute('aria-expanded')).toBe('false');
  });
});
