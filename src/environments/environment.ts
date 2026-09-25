/**
 * Build-time configuration for panel-web.
 * Hosts live here — never hardcode API URLs inside components.
 * No Google client secrets belong in this front.
 */
export const environment = {
  production: true,
  /** Base URL of panel-api (no trailing slash). Paths are under `/panel`. */
  panelApiBaseUrl: 'https://api.friendly-e-shop.test',
} as const;
