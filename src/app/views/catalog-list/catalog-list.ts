import { NgClass } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';
import { ProductGallery } from '../../core/components/product-gallery/product-gallery';
import { ProductStatus } from '../../core/components/product-status/product-status';
import { PRODUCT_ORIGIN } from '../../core/constants/product-origin';
import { PRODUCT_STAGE } from '../../core/constants/product-stage';
import { CatalogProduct } from '../../core/models/catalog-product';
import { Catalog } from '../../core/services/catalog/catalog';
import { Session } from '../../core/services/session/session';

type CatalogActionKind = 'publish' | 'unpublish' | 'delete' | 'publishCatalog';

interface CatalogAction {
  kind: CatalogActionKind;
  product?: CatalogProduct;
}

const ACTION_TITLES: Record<CatalogActionKind, string> = {
  publish: 'Publicar producto',
  unpublish: 'Despublicar producto',
  delete: 'Eliminar producto',
  publishCatalog: 'Publicar catálogo',
};

const ACTION_LABELS: Record<CatalogActionKind, string> = {
  publish: 'Publicar',
  unpublish: 'Despublicar',
  delete: 'Eliminar',
  publishCatalog: 'Publicar catálogo',
};

@Component({
  selector: 'app-catalog-list-view',
  standalone: true,
  imports: [NgClass, RouterLink, ProductStatus, ProductGallery, ConfirmDialog],
  templateUrl: './catalog-list.html',
  host: { class: 'flex min-h-0 flex-1 flex-col gap-4' },
})
export class CatalogListView implements OnInit {
  private readonly catalog = inject(Catalog);
  private readonly session = inject(Session);

  readonly authenticated = this.session.authenticated;
  readonly loading = this.catalog.loading;
  readonly error = this.catalog.error;
  readonly filter = this.catalog.filter;
  readonly filterDraft = signal('');

  readonly pendingAction = signal<CatalogAction | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly hasLocalProducts = computed(() => this.catalog.localGroup().length > 0);

  readonly groups = computed(() => {
    const groups: { heading: string; products: CatalogProduct[] }[] = [];
    const local = this.catalog.localGroup();
    const account = this.catalog.accountGroup();
    if (local.length > 0) {
      groups.push({
        heading: this.authenticated() ? 'Locales sin dueño' : 'Productos locales',
        products: local,
      });
    }
    if (account.length > 0) {
      groups.push({ heading: 'De tu cuenta', products: account });
    }
    return groups;
  });

  readonly dialogTitle = computed(() => {
    const action = this.pendingAction();
    return action ? ACTION_TITLES[action.kind] : '';
  });

  readonly dialogConfirmLabel = computed(() => {
    const action = this.pendingAction();
    return action ? ACTION_LABELS[action.kind] : '';
  });

  readonly dialogDestructive = computed(() => this.pendingAction()?.kind === 'delete');

  readonly publishCatalogEnabled = computed(
    () => this.authenticated() && this.catalog.canPublishCatalog(),
  );

  readonly dialogMessage = computed(() => {
    const action = this.pendingAction();
    if (!action) {
      return '';
    }
    if (action.kind === 'publishCatalog') {
      return 'Se publicarán y pasarán a tu cuenta todos los borradores visibles.';
    }
    const name = action.product?.name ?? '';
    if (action.kind === 'publish') {
      return `¿Querés publicar "${name}"?`;
    }
    if (action.kind === 'unpublish') {
      return `¿Querés despublicar "${name}"?`;
    }
    return `¿Querés eliminar "${name}"? Esta acción no se puede deshacer.`;
  });

  ngOnInit(): void {
    this.catalog.load();
  }

  onFilterInput(event: Event): void {
    this.filterDraft.set((event.target as HTMLInputElement).value);
  }

  applyFilters(): void {
    this.catalog.applyFilter(this.filterDraft());
  }

  clearFilters(): void {
    this.filterDraft.set('');
    this.catalog.clearFilters();
  }

  isDraft(product: CatalogProduct): boolean {
    return product.stage === PRODUCT_STAGE.draft;
  }

  isPublished(product: CatalogProduct): boolean {
    return product.stage === PRODUCT_STAGE.published;
  }

  requestPublish(product: CatalogProduct): void {
    if (!this.authenticated()) {
      return;
    }
    this.pendingAction.set({ kind: 'publish', product });
  }

  requestUnpublish(product: CatalogProduct): void {
    if (!this.authenticated()) {
      return;
    }
    this.pendingAction.set({ kind: 'unpublish', product });
  }

  requestDelete(product: CatalogProduct): void {
    if (product.origin !== PRODUCT_ORIGIN.local && !this.authenticated()) {
      return;
    }
    this.pendingAction.set({ kind: 'delete', product });
  }

  requestPublishCatalog(): void {
    if (!this.publishCatalogEnabled()) {
      return;
    }
    this.pendingAction.set({ kind: 'publishCatalog' });
  }

  cancelAction(): void {
    this.pendingAction.set(null);
  }

  confirmAction(): void {
    const action = this.pendingAction();
    if (!action) {
      return;
    }

    this.pendingAction.set(null);
    this.actionError.set(null);

    if (action.kind === 'publish' && action.product) {
      this.catalog.publish(action.product).subscribe({
        error: () => this.actionError.set('No se pudo publicar el producto.'),
      });
      return;
    }

    if (action.kind === 'unpublish' && action.product) {
      this.catalog.unpublish(action.product).subscribe({
        error: () => this.actionError.set('No se pudo despublicar el producto.'),
      });
      return;
    }

    if (action.kind === 'delete' && action.product) {
      this.catalog.remove(action.product).subscribe({
        error: () => this.actionError.set('No se pudo eliminar el producto.'),
      });
      return;
    }

    if (action.kind === 'publishCatalog') {
      this.catalog.publishCatalog().subscribe({
        error: () => this.actionError.set('No se pudo publicar el catálogo.'),
      });
    }
  }
}
