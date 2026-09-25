import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  GoogleLoginStartResponse,
  SessionLookupResponse,
} from './session.model';

/**
 * Typed HTTP client for identity operations against panel-api only.
 * Never points at the account service.
 */
@Injectable({ providedIn: 'root' })
export class PanelApiIdentityClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.panelApiBaseUrl;

  /** Starts Google access; panel-api returns the authorization URL to navigate to. */
  startGoogleLogin(): Observable<GoogleLoginStartResponse> {
    return this.http.get<GoogleLoginStartResponse>(
      `${this.baseUrl}/panel/identity/google/start`,
      { withCredentials: true },
    );
  }

  /** Current shared session / quién soy. */
  getSession(): Observable<SessionLookupResponse> {
    return this.http.get<SessionLookupResponse>(
      `${this.baseUrl}/panel/identity/me`,
      { withCredentials: true },
    );
  }

  /** Closes the shared session via panel-api. */
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/panel/identity/logout`,
      {},
      { withCredentials: true },
    );
  }
}
