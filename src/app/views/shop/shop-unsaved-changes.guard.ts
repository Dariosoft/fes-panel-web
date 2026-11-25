import { CanDeactivateFn } from '@angular/router';
import { ShopView } from './shop';

export const shopUnsavedChangesGuard: CanDeactivateFn<ShopView> = (component) =>
  component.confirmDiscard();
