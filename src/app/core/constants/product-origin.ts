export const PRODUCT_ORIGIN = {
  local: 'local',
  server: 'server',
} as const;

export type ProductOrigin = (typeof PRODUCT_ORIGIN)[keyof typeof PRODUCT_ORIGIN];
