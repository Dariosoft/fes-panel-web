import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Select } from './select';

describe('Select', () => {
  let fixture: ComponentFixture<Select>;

  const options = [
    { value: 'ARS', label: 'ARS' },
    { value: 'USD', label: 'USD' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Select] });
    fixture = TestBed.createComponent(Select);
  });

  const trigger = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('button[role="combobox"]');
  const optionElements = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('[role="option"]'));

  it('shows the label of the current value', async () => {
    fixture.componentRef.setInput('options', options);
    fixture.componentInstance.writeValue('USD');
    await fixture.whenStable();

    expect(trigger().textContent).toContain('USD');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens the listbox and emits the chosen value', async () => {
    fixture.componentRef.setInput('options', options);
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue('ARS');
    await fixture.whenStable();

    trigger().click();
    await fixture.whenStable();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(optionElements()).toHaveLength(2);

    optionElements()[1].click();
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith('USD');
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('selects with the keyboard', async () => {
    fixture.componentRef.setInput('options', options);
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue('ARS');
    await fixture.whenStable();

    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    await fixture.whenStable();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await fixture.whenStable();

    expect(onChange).toHaveBeenCalledWith('USD');
  });

  it('closes on Escape without changing the value', async () => {
    fixture.componentRef.setInput('options', options);
    const onChange = vi.fn();
    fixture.componentInstance.registerOnChange(onChange);
    fixture.componentInstance.writeValue('ARS');
    await fixture.whenStable();

    trigger().click();
    await fixture.whenStable();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not open when disabled', async () => {
    fixture.componentRef.setInput('options', options);
    fixture.componentInstance.writeValue('ARS');
    fixture.componentInstance.setDisabledState(true);
    await fixture.whenStable();

    trigger().click();
    await fixture.whenStable();

    expect(trigger().disabled).toBe(true);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
  });
});
