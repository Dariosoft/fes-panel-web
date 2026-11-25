import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ShopView } from './shop';
import { shopUnsavedChangesGuard } from './shop-unsaved-changes.guard';

describe('shopUnsavedChangesGuard', () => {
  const runGuard = (component: Pick<ShopView, 'confirmDiscard'>): unknown =>
    shopUnsavedChangesGuard(
      component as ShopView,
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
      {} as RouterStateSnapshot,
    );

  it('allows leaving when there are no changes', () => {
    const component = { confirmDiscard: () => true };

    expect(runGuard(component)).toBe(true);
  });

  it('allows leaving when the user confirms discarding changes', async () => {
    const component = { confirmDiscard: () => Promise.resolve(true) };

    await expect(runGuard(component)).resolves.toBe(true);
  });

  it('blocks leaving when the user cancels discarding changes', async () => {
    const component = { confirmDiscard: () => Promise.resolve(false) };

    await expect(runGuard(component)).resolves.toBe(false);
  });
});
