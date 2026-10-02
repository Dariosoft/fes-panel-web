import { ProductOrigin } from '../constants/product-origin';
import { ProductStage } from '../constants/product-stage';

export type Currency = 'ARS' | 'USD';

export interface ProductImage {
  id: string;
  name?: string;
  url?: string;
  dataUrl?: string;
  file?: File;
}

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  stock?: number;
  stage: ProductStage;
  owned: boolean;
  origin: ProductOrigin;
  images: ProductImage[];
  createdAt: string;
}

export interface EditableProduct {
  id?: string;
  name: string;
  price: number;
  currency: Currency;
  stock?: number;
  images: ProductImage[];
}
