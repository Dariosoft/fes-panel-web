import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionProfile } from './session-profile';

@Injectable({ providedIn: 'root' })
export class PanelSession {
  private readonly http = inject(HttpClient);
  private readonly panelBaseUrl = `${environment.apiBaseUrl}/panel`;

  getSession(): Observable<SessionProfile> {
    return this.http.get<SessionProfile>(`${this.panelBaseUrl}/session`, {
      withCredentials: true,
    });
  }

  logout(): Observable<SessionProfile> {
    return this.http.post<SessionProfile>(`${this.panelBaseUrl}/logout`, null, {
      withCredentials: true,
    });
  }
}
