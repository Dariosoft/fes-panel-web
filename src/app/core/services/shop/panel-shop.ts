import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Shop } from '../../models/shop';

@Injectable({ providedIn: 'root' })
export class PanelShop {
  private readonly http = inject(HttpClient);
  private readonly shopUrl = `${environment.apiBaseUrl}/panel/shop`;

  get(): Observable<Shop | null> {
    return this.http.get<Shop>(this.shopUrl, { withCredentials: true }).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      }),
    );
  }

  save(shop: Shop): Observable<Shop> {
    return this.http.put<Shop>(this.shopUrl, shop, { withCredentials: true });
  }
}
