import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PRODUCT_ORIGIN } from '../../constants/product-origin';
import { CatalogProduct, EditableProduct } from '../../models/catalog-product';

interface ServerProductImage {
  id: string;
  url: string;
}

interface ServerProduct {
  id: string;
  ownerAccountId: string | null;
  name: string;
  price: number;
  currency: CatalogProduct['currency'];
  stock: number | null;
  stage: CatalogProduct['stage'];
  images: ServerProductImage[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PanelCatalog {
  private readonly http = inject(HttpClient);
  private readonly catalogBaseUrl = `${environment.apiBaseUrl}/panel/catalog`;

  list(name?: string): Observable<CatalogProduct[]> {
    const params = name ? new HttpParams().set('name', name) : undefined;
    return this.http
      .get<ServerProduct[]>(`${this.catalogBaseUrl}/products`, { withCredentials: true, params })
      .pipe(map((products) => products.map((product) => this.toCatalogProduct(product))));
  }

  create(product: EditableProduct): Observable<CatalogProduct> {
    return this.http
      .post<ServerProduct>(`${this.catalogBaseUrl}/products`, this.toFormData(product), {
        withCredentials: true,
      })
      .pipe(map((created) => this.toCatalogProduct(created)));
  }

  update(product: EditableProduct): Observable<CatalogProduct> {
    return this.http
      .put<ServerProduct>(
        `${this.catalogBaseUrl}/products/${product.id}`,
        this.toFormData(product),
        { withCredentials: true },
      )
      .pipe(map((updated) => this.toCatalogProduct(updated)));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.catalogBaseUrl}/products/${id}`, {
      withCredentials: true,
    });
  }

  publish(id: string): Observable<CatalogProduct> {
    return this.http
      .post<ServerProduct>(`${this.catalogBaseUrl}/products/${id}/publish`, null, {
        withCredentials: true,
      })
      .pipe(map((published) => this.toCatalogProduct(published)));
  }

  unpublish(id: string): Observable<CatalogProduct> {
    return this.http
      .post<ServerProduct>(`${this.catalogBaseUrl}/products/${id}/unpublish`, null, {
        withCredentials: true,
      })
      .pipe(map((unpublished) => this.toCatalogProduct(unpublished)));
  }

  publishCatalog(): Observable<void> {
    return this.http.post<void>(`${this.catalogBaseUrl}/publish`, {}, { withCredentials: true });
  }

  private toCatalogProduct(product: ServerProduct): CatalogProduct {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      currency: product.currency,
      stock: product.stock ?? undefined,
      stage: product.stage,
      owned: product.ownerAccountId != null,
      origin: PRODUCT_ORIGIN.server,
      images: (product.images ?? []).map((image) => ({ id: image.id, url: image.url })),
      createdAt: product.createdAt,
    };
  }

  private toFormData(product: EditableProduct): FormData {
    const formData = new FormData();
    formData.append('name', product.name);
    formData.append('price', String(product.price));
    formData.append('currency', product.currency);
    if (product.stock !== undefined) {
      formData.append('stock', String(product.stock));
    }
    for (const image of product.images) {
      if (image.file) {
        formData.append('images', image.file, image.name ?? image.file.name);
      }
    }
    return formData;
  }
}
