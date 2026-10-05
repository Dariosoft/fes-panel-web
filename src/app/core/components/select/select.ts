import {
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ChevronDown, LucideAngularModule, type LucideIconData } from 'lucide-angular';

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './select.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class Select implements ControlValueAccessor {
  private static nextId = 0;

  private readonly instanceId = Select.nextId++;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly options = input.required<readonly SelectOption[]>();
  readonly controlId = input('');
  readonly placeholder = input('Seleccionar');
  readonly chevron = input<LucideIconData>(ChevronDown);

  readonly value = signal('');
  readonly open = signal(false);
  readonly disabled = signal(false);
  readonly activeIndex = signal(-1);

  readonly listboxId = `select-${this.instanceId}-listbox`;

  readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? this.placeholder(),
  );

  readonly activeDescendant = computed(() => {
    const option = this.options()[this.activeIndex()];
    return this.open() && option ? this.optionId(option) : null;
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  optionId(option: SelectOption): string {
    return `select-${this.instanceId}-option-${option.value}`;
  }

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (this.open()) {
      this.close();
      return;
    }
    this.openMenu();
  }

  close(): void {
    this.open.set(false);
  }

  markTouched(): void {
    this.onTouched();
  }

  select(option: SelectOption): void {
    this.value.set(option.value);
    this.onChange(option.value);
    this.onTouched();
    this.close();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    const options = this.options();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.open()) {
          this.openMenu();
        } else {
          this.activeIndex.update((index) => Math.min(index + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this.open()) {
          this.openMenu();
        } else {
          this.activeIndex.update((index) => Math.max(index - 1, 0));
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.open() && this.activeIndex() >= 0) {
          this.select(options[this.activeIndex()]);
        } else {
          this.openMenu();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  private openMenu(): void {
    const current = this.options().findIndex((option) => option.value === this.value());
    this.activeIndex.set(current);
    this.open.set(true);
  }
}
