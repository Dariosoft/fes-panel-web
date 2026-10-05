import { ProductOrigin } from '../constants/product-origin';
import { ProductStage } from '../constants/product-stage';
import { ImageItem } from './image-item';

export type Currency = 'ARS' | 'USD';

export interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  stock?: number;
  stage: ProductStage;
  owned: boolean;
  origin: ProductOrigin;
  images: ImageItem[];
  createdAt: string;
}

export interface EditableProduct {
  id?: string;
  name: string;
  price: number;
  currency: Currency;
  stock?: number;
  images: ImageItem[];
}

export interface ServerImageItem {
  id: string;
  url: string;
}

export interface ServerProduct {
  id: string;
  ownerAccountId: string | null;
  name: string;
  price: number;
  currency: CatalogProduct['currency'];
  stock: number | null;
  stage: CatalogProduct['stage'];
  images: ServerImageItem[];
  createdAt: string;
}