import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CATALOG_STORAGE_KEYS } from '../../constants/catalog-storage-keys';
import { PendingCatalogOperation } from '../../models/pending-catalog-operation';
import { Session } from '../session/session';

export type ReplayCatalogOperation = (operation: PendingCatalogOperation) => Observable<unknown>;

@Injectable({ providedIn: 'root' })
export class CatalogRecovery {
  private readonly session = inject(Session);

  remember(operation: PendingCatalogOperation): void {
    sessionStorage.setItem(CATALOG_STORAGE_KEYS.pendingOperation, JSON.stringify(operation));
  }

  resumeIfPending(replay: ReplayCatalogOperation): void {
    if (!this.session.authenticated()) {
      return;
    }

    const operation = this.read();
    if (!operation) {
      return;
    }

    replay(operation).subscribe({
      next: () => this.clear(),
      error: () => this.clear(),
    });
  }

  clear(): void {
    sessionStorage.removeItem(CATALOG_STORAGE_KEYS.pendingOperation);
  }

  private read(): PendingCatalogOperation | null {
    const stored = sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation);
    if (!stored) {
      return null;
    }

    try {
      const operation = JSON.parse(stored) as Partial<PendingCatalogOperation>;
      return typeof operation.kind === 'string' ? (operation as PendingCatalogOperation) : null;
    } catch {
      this.clear();
      return null;
    }
  }
}
