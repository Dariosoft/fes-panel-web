import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { PRODUCT_ORIGIN } from '../../constants/product-origin';
import { PRODUCT_STAGE } from '../../constants/product-stage';
import { CatalogProduct, EditableProduct } from '../../models/catalog-product';
import { PendingCatalogOperation } from '../../models/pending-catalog-operation';
import { Session } from '../session/session';
import { CatalogRecovery } from './catalog-recovery';
import { LocalCatalog } from './local-catalog';
import { PanelCatalog } from './panel-catalog';

@Injectable({ providedIn: 'root' })
export class Catalog {
  private readonly session = inject(Session);
  private readonly localCatalog = inject(LocalCatalog);
  private readonly panelCatalog = inject(PanelCatalog);
  private readonly recovery = inject(CatalogRecovery);

  private readonly localProductsSignal = signal<CatalogProduct[]>([]);
  private readonly serverProductsSignal = signal<CatalogProduct[]>([]);
  private readonly filterSignal = signal('');
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly filter = this.filterSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly localGroup = computed(() =>
    this.sortByNewest(this.applyLocalFilter(this.localProductsSignal())),
  );
  readonly accountGroup = computed(() => this.sortByNewest(this.serverProductsSignal()));
  readonly canPublishCatalog = computed(() =>
    [...this.localProductsSignal(), ...this.serverProductsSignal()].some(
      (product) => product.stage === PRODUCT_STAGE.draft,
    ),
  );

  constructor() {
    effect(() => {
      if (this.session.authenticated()) {
        this.resumePending();
      }
    });
  }

  applyFilter(name: string): void {
    this.filterSignal.set(name.trim());
    if (this.session.authenticated()) {
      this.refreshServerProducts();
    }
  }

  clearFilters(): void {
    this.filterSignal.set('');
    if (this.session.authenticated()) {
      this.refreshServerProducts();
    }
  }

  resumePending(): void {
    this.recovery.resumeIfPending((operation) =>
      this.replay(operation).pipe(tap(() => this.load())),
    );
  }

  private findById(id: string): CatalogProduct | undefined {
    return [...this.localProductsSignal(), ...this.serverProductsSignal()].find(
      (product) => product.id === id,
    );
  }

  getProduct(id: string): Observable<CatalogProduct | undefined> {
    const local = this.localCatalog.list().find((product) => product.id === id);
    if (local) {
      this.localProductsSignal.set(this.localCatalog.list());
      return of(local);
    }

    const known = this.serverProductsSignal().find((product) => product.id === id);
    if (known || !this.session.authenticated()) {
      return of(known);
    }

    return this.panelCatalog.list().pipe(
      tap((products) => this.serverProductsSignal.set(products)),
      map((products) => products.find((product) => product.id === id)),
      catchError(() => of(undefined)),
    );
  }

  load(): void {
    this.localProductsSignal.set(this.localCatalog.list());

    if (!this.session.authenticated()) {
      this.serverProductsSignal.set([]);
      return;
    }

    this.refreshServerProducts();
  }

  private refreshServerProducts(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.panelCatalog.list(this.filterSignal()).subscribe({
      next: (products) => {
        this.serverProductsSignal.set(products);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.serverProductsSignal.set([]);
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar los productos de tu cuenta.');
      },
    });
  }

  save(product: EditableProduct): Observable<CatalogProduct> {
    if (this.isLocalProduct(product)) {
      return of(this.saveLocally(product));
    }

    const request = product.id
      ? this.panelCatalog.update(product)
      : this.panelCatalog.create(product);

    return request.pipe(
      tap((saved) => this.applyServerProduct(saved)),
      catchError((error) => this.fail(error, { kind: 'save', productId: product.id, payload: product })),
    );
  }

  publish(product: CatalogProduct): Observable<CatalogProduct> {
    if (product.origin === PRODUCT_ORIGIN.local) {
      return this.panelCatalog.create(this.toEditable(product)).pipe(
        switchMap((created) => this.panelCatalog.publish(created.id)),
        tap((published) => {
          this.localCatalog.remove(product.id);
          this.localProductsSignal.set(this.localCatalog.list());
          this.applyServerProduct(published);
        }),
        catchError((error) =>
          this.fail(error, {
            kind: 'publish',
            productId: product.id,
            productOrigin: product.origin,
          }),
        ),
      );
    }

    return this.panelCatalog.publish(product.id).pipe(
      tap((published) => this.applyServerProduct(published)),
      catchError((error) =>
        this.fail(error, { kind: 'publish', productId: product.id, productOrigin: product.origin }),
      ),
    );
  }

  unpublish(product: CatalogProduct): Observable<CatalogProduct> {
    return this.panelCatalog.unpublish(product.id).pipe(
      tap((updated) => this.applyServerProduct(updated)),
      catchError((error) => this.fail(error, { kind: 'unpublish', productId: product.id })),
    );
  }

  remove(product: CatalogProduct): Observable<void> {
    if (product.origin === PRODUCT_ORIGIN.local) {
      this.localCatalog.remove(product.id);
      this.localProductsSignal.set(this.localCatalog.list());
      return of(undefined);
    }

    return this.panelCatalog.delete(product.id).pipe(
      tap(() =>
        this.serverProductsSignal.set(
          this.serverProductsSignal().filter((candidate) => candidate.id !== product.id),
        ),
      ),
      catchError((error) =>
        this.fail(error, { kind: 'delete', productId: product.id, productOrigin: product.origin }),
      ),
    );
  }

  publishCatalog(): Observable<void> {
    const localDrafts = this.localProductsSignal().filter(
      (product) => product.stage === PRODUCT_STAGE.draft,
    );
    const creations = localDrafts.map((product) =>
      this.panelCatalog.create(this.toEditable(product)),
    );
    const createAll = creations.length > 0 ? forkJoin(creations) : of<CatalogProduct[]>([]);

    return createAll.pipe(
      switchMap(() => this.panelCatalog.publishCatalog()),
      tap(() => {
        for (const local of localDrafts) {
          this.localCatalog.remove(local.id);
        }
        this.localProductsSignal.set(this.localCatalog.list());
      }),
      switchMap(() => this.panelCatalog.list()),
      tap((products) => this.serverProductsSignal.set(products)),
      map(() => undefined),
      catchError((error) => this.fail(error, { kind: 'publishCatalog' })),
    );
  }

  private fail(error: unknown, operation: PendingCatalogOperation): Observable<never> {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.recovery.remember(operation);
      this.session.enterWithGoogle();
    }
    return throwError(() => error);
  }

  private replay(operation: PendingCatalogOperation): Observable<unknown> {
    switch (operation.kind) {
      case 'save':
        if (operation.payload?.id) {
          return this.panelCatalog.update(operation.payload);
        }
        return this.requirePayload(operation).pipe(
          switchMap((payload) => this.panelCatalog.create(payload)),
        );
      case 'publish':
        if (operation.productOrigin === PRODUCT_ORIGIN.local) {
          return this.requireProduct(operation.productId).pipe(
            switchMap((product) => this.panelCatalog.create(this.toEditable(product))),
            switchMap((created) => this.panelCatalog.publish(created.id)),
          );
        }
        return this.requireId(operation).pipe(switchMap((id) => this.panelCatalog.publish(id)));
      case 'unpublish':
        return this.requireId(operation).pipe(switchMap((id) => this.panelCatalog.unpublish(id)));
      case 'delete':
        if (operation.productOrigin === PRODUCT_ORIGIN.local) {
          return of(undefined);
        }
        return this.requireId(operation).pipe(switchMap((id) => this.panelCatalog.delete(id)));
      case 'publishCatalog':
        return this.panelCatalog.publishCatalog();
    }
  }

  private requireId(operation: PendingCatalogOperation): Observable<string> {
    return operation.productId
      ? of(operation.productId)
      : throwError(() => new Error('La operación pendiente no tiene producto.'));
  }

  private requirePayload(operation: PendingCatalogOperation): Observable<EditableProduct> {
    return operation.payload
      ? of(operation.payload)
      : throwError(() => new Error('La operación pendiente no tiene datos.'));
  }

  private requireProduct(id: string | undefined): Observable<CatalogProduct> {
    const product = id ? this.findById(id) : undefined;
    return product
      ? of(product)
      : throwError(() => new Error('No encontramos el producto pendiente.'));
  }

  private toEditable(product: CatalogProduct): EditableProduct {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      images: product.images,
    };
  }

  private isLocalProduct(product: EditableProduct): boolean {
    if (product.id) {
      return this.localProductsSignal().some((candidate) => candidate.id === product.id);
    }
    return !this.session.authenticated();
  }

  private saveLocally(product: EditableProduct): CatalogProduct {
    const existing = product.id
      ? this.localProductsSignal().find((candidate) => candidate.id === product.id)
      : undefined;

    const stored: CatalogProduct = {
      id: product.id ?? this.createLocalId(),
      name: product.name,
      price: product.price,
      currency: product.currency,
      stock: product.stock,
      stage: PRODUCT_STAGE.draft,
      owned: false,
      origin: PRODUCT_ORIGIN.local,
      images: product.images.map((image) => ({
        id: image.id,
        name: image.name,
        dataUrl: image.dataUrl,
      })),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };

    this.localCatalog.upsert(stored);
    this.localProductsSignal.set(this.localCatalog.list());
    return stored;
  }

  private applyServerProduct(product: CatalogProduct): void {
    const products = this.serverProductsSignal();
    const index = products.findIndex((candidate) => candidate.id === product.id);
    if (index === -1) {
      this.serverProductsSignal.set([product, ...products]);
      return;
    }

    const updated = [...products];
    updated[index] = product;
    this.serverProductsSignal.set(updated);
  }

  private createLocalId(): string {
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private applyLocalFilter(products: CatalogProduct[]): CatalogProduct[] {
    const term = this.filterSignal().trim().toLowerCase();
    if (!term) {
      return products;
    }
    return products.filter((product) => product.name.toLowerCase().includes(term));
  }

  private sortByNewest(products: CatalogProduct[]): CatalogProduct[] {
    return [...products].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }
}
