import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CatalogProduct, EditableProduct } from '../../models/catalog-product';

@Injectable({ providedIn: 'root' })
export class PanelCatalog {
  private readonly http = inject(HttpClient);
  private readonly catalogBaseUrl = `${environment.apiBaseUrl}/panel/catalog`;

  list(): Observable<CatalogProduct[]> {
    return this.http.get<CatalogProduct[]>(`${this.catalogBaseUrl}/products`, {
      withCredentials: true,
    });
  }

  create(product: EditableProduct): Observable<CatalogProduct> {
    return this.http.post<CatalogProduct>(`${this.catalogBaseUrl}/products`, this.toFormData(product), {
      withCredentials: true,
    });
  }

  update(product: EditableProduct): Observable<CatalogProduct> {
    return this.http.put<CatalogProduct>(
      `${this.catalogBaseUrl}/products/${product.id}`,
      this.toFormData(product),
      { withCredentials: true },
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.catalogBaseUrl}/products/${id}`, {
      withCredentials: true,
    });
  }

  publish(id: string): Observable<CatalogProduct> {
    return this.http.post<CatalogProduct>(`${this.catalogBaseUrl}/products/${id}/publish`, null, {
      withCredentials: true,
    });
  }

  unpublish(id: string): Observable<CatalogProduct> {
    return this.http.post<CatalogProduct>(`${this.catalogBaseUrl}/products/${id}/unpublish`, null, {
      withCredentials: true,
    });
  }

  publishCatalog(): Observable<CatalogProduct[]> {
    return this.http.post<CatalogProduct[]>(`${this.catalogBaseUrl}/publish`, null, {
      withCredentials: true,
    });
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
