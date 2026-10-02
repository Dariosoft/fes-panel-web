import { Injectable } from '@angular/core';
import { CATALOG_STORAGE_KEYS } from '../../constants/catalog-storage-keys';
import { CatalogProduct } from '../../models/catalog-product';

@Injectable({ providedIn: 'root' })
export class LocalCatalog {
  list(): CatalogProduct[] {
    const stored = sessionStorage.getItem(CATALOG_STORAGE_KEYS.localProducts);
    if (!stored) {
      return [];
    }

    try {
      const products = JSON.parse(stored) as unknown;
      return Array.isArray(products) ? (products as CatalogProduct[]) : [];
    } catch {
      sessionStorage.removeItem(CATALOG_STORAGE_KEYS.localProducts);
      return [];
    }
  }

  upsert(product: CatalogProduct): void {
    const products = this.list();
    const existingIndex = products.findIndex((candidate) => candidate.id === product.id);
    if (existingIndex === -1) {
      products.push(product);
    } else {
      products[existingIndex] = product;
    }
    this.persist(products);
  }

  remove(id: string): void {
    this.persist(this.list().filter((product) => product.id !== id));
  }

  private persist(products: CatalogProduct[]): void {
    sessionStorage.setItem(CATALOG_STORAGE_KEYS.localProducts, JSON.stringify(products));
  }
}
