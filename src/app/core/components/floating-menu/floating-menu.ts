import { Component, ElementRef, inject, input, signal } from '@angular/core';
import { LucideAngularModule, Plus, X, type LucideIconData } from 'lucide-angular';

export interface FloatingMenuItem {
  readonly id: string;
  readonly label: string;
  readonly icon: LucideIconData;
  readonly action: () => void;
  readonly disabled?: boolean;
}

@Component({
  selector: 'app-floating-menu',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './floating-menu.html',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class FloatingMenu {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly items = input<readonly FloatingMenuItem[]>([]);
  readonly icon = input<LucideIconData>(Plus);
  readonly closeIcon = input<LucideIconData>(X);
  readonly menuLabel = input('Acciones');
  readonly closeLabel = input('Cerrar acciones');

  readonly open = signal(false);

  toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  select(item: FloatingMenuItem): void {
    if (item.disabled) {
      return;
    }
    item.action();
    this.close();
  }

  onDocumentClick(event: MouseEvent): void {
    if (!this.open() || this.host.nativeElement.contains(event.target as Node)) {
      return;
    }
    this.close();
  }
}
