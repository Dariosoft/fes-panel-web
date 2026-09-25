/** Profile returned by panel-api when a shared session is active. */
export interface SessionProfile {
  name: string;
  email: string;
}

/** Response of the quién-soy / session probe on panel-api. */
export interface SessionLookupResponse {
  authenticated: boolean;
  name?: string;
  email?: string;
}

/** Response that starts the Google access flow via panel-api. */
export interface GoogleLoginStartResponse {
  authorizationUrl: string;
}
