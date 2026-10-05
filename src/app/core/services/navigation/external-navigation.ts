import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExternalNavigation {
  private readonly document = inject(DOCUMENT);

  navigateTo(url: string): void {
    this.document.location.assign(url);
  }

  reload(): void {
    this.document.location.reload();
  }
}
