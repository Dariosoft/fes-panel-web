export interface AnonymousSessionProfile {
  authenticated: false;
}

export interface AuthenticatedSessionProfile {
  authenticated: true;
  id: string;
  email: string;
  name: string;
}

export type SessionProfile = AnonymousSessionProfile | AuthenticatedSessionProfile;
