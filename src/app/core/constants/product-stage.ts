export const PRODUCT_STAGE = {
  draft: 'draft',
  published: 'published',
} as const;

export type ProductStage = (typeof PRODUCT_STAGE)[keyof typeof PRODUCT_STAGE];
