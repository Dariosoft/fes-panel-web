import { CatalogProduct } from "./catalog-product";

export type CatalogActionKind = 'publish' | 'unpublish' | 'delete' | 'publishCatalog';

export interface CatalogAction {
  kind: CatalogActionKind;
  product?: CatalogProduct;
}