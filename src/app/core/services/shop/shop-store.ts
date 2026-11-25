import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { Shop } from '../../models/shop';
import { PanelShop } from './panel-shop';

export const SHOP_LOAD_ERROR_MESSAGE = 'No pudimos cargar tu tienda. Intentá de nuevo.';
export const SHOP_SAVE_ERROR_MESSAGE = 'No pudimos guardar tu tienda. Intentá de nuevo.';

@Injectable({ providedIn: 'root' })
export class ShopStore {
  private readonly panelShop = inject(PanelShop);

  private readonly shopSignal = signal<Shop | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly loadErrorSignal = signal<string | null>(null);
  private readonly notFoundSignal = signal(false);
  private readonly savingSignal = signal(false);
  private readonly saveErrorSignal = signal<string | null>(null);
  private readonly savedSignal = signal(false);

  readonly shop = this.shopSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loadError = this.loadErrorSignal.asReadonly();
  readonly notFound = this.notFoundSignal.asReadonly();
  readonly saving = this.savingSignal.asReadonly();
  readonly saveError = this.saveErrorSignal.asReadonly();
  readonly saved = this.savedSignal.asReadonly();

  load(): void {
    this.loadingSignal.set(true);
    this.loadErrorSignal.set(null);
    this.notFoundSignal.set(false);
    this.savedSignal.set(false);

    this.panelShop.get().subscribe({
      next: (shop) => {
        this.shopSignal.set(shop);
        this.notFoundSignal.set(shop === null);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.loadErrorSignal.set(SHOP_LOAD_ERROR_MESSAGE);
      },
    });
  }

  retry(): void {
    this.load();
  }

  save(shop: Shop): Observable<Shop> {
    this.savingSignal.set(true);
    this.saveErrorSignal.set(null);
    this.savedSignal.set(false);

    return this.panelShop.save(shop).pipe(
      tap((saved) => {
        this.shopSignal.set(saved);
        this.notFoundSignal.set(false);
        this.savingSignal.set(false);
        this.savedSignal.set(true);
      }),
      catchError((error: unknown) => {
        this.savingSignal.set(false);
        this.saveErrorSignal.set(SHOP_SAVE_ERROR_MESSAGE);
        return throwError(() => error);
      }),
    );
  }
}
