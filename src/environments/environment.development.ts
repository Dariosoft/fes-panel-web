/**
 * Local / development overrides. Same shape as production environment;
 * no secrets or Google client credentials.
 */
export const environment = {
  production: false,
  panelApiBaseUrl: 'http://localhost:8000',
} as const;
