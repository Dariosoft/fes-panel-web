import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionProfile } from './session-profile';

@Injectable({ providedIn: 'root' })
export class PanelSession {
  private readonly http = inject(HttpClient);
  private readonly identityBaseUrl = `${environment.apiBaseUrl}/panel/identity`;

  getSession(): Observable<SessionProfile> {
    return this.http.get<SessionProfile>(`${this.identityBaseUrl}/session`, {
      withCredentials: true,
    });
  }

  logout(): Observable<SessionProfile> {
    return this.http.delete<SessionProfile>(`${this.identityBaseUrl}/session`, {
      withCredentials: true,
    });
  }
}
