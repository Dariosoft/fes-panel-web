import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, computed, effect, inject, input, output, viewChild } from '@angular/core';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  private readonly document = inject(DOCUMENT);

  readonly open = input(false);
  readonly title = input('Confirmar');
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly destructive = input(false);

  readonly confirmClasses = computed(() =>
    this.destructive()
      ? 'bg-destructive text-on-destructive hover:bg-destructive/90'
      : 'bg-accent text-on-accent hover:bg-accent/90',
  );

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private previouslyFocused: HTMLElement | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const panel = this.panel()?.nativeElement;

      if (!isOpen) {
        this.restoreFocus();
        return;
      }

      if (!this.wasOpen) {
        this.previouslyFocused = this.document.activeElement as HTMLElement | null;
        this.wasOpen = true;
      }

      if (panel && !panel.contains(this.document.activeElement)) {
        panel.focus();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.cancelled.emit();
  }

  private trapFocus(event: KeyboardEvent): void {
    const panel = this.panel()?.nativeElement;
    if (!panel) {
      return;
    }

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private restoreFocus(): void {
    if (!this.wasOpen) {
      return;
    }
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
    this.wasOpen = false;
  }
}
