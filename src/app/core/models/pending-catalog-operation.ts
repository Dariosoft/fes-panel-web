import { ProductOrigin } from '../constants/product-origin';
import { EditableProduct } from './catalog-product';

export type PendingCatalogOperationKind =
  | 'save'
  | 'publish'
  | 'unpublish'
  | 'delete'
  | 'publishCatalog';

export interface PendingCatalogOperation {
  kind: PendingCatalogOperationKind;
  productId?: string;
  productOrigin?: ProductOrigin;
  payload?: EditableProduct;
}
