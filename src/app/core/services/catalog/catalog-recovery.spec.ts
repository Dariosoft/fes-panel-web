import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { CATALOG_STORAGE_KEYS } from '../../constants/catalog-storage-keys';
import { PendingCatalogOperation } from '../../models/pending-catalog-operation';
import { Session } from '../session/session';
import { CatalogRecovery } from './catalog-recovery';

describe('CatalogRecovery', () => {
  let recovery: CatalogRecovery;
  let authenticated: boolean;

  const operation: PendingCatalogOperation = { kind: 'publish', productId: 'product-1' };

  beforeEach(() => {
    sessionStorage.clear();
    authenticated = true;
    TestBed.configureTestingModule({
      providers: [{ provide: Session, useValue: { authenticated: () => authenticated } }],
    });
    recovery = TestBed.inject(CatalogRecovery);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('persists the intention in sessionStorage', () => {
    recovery.remember(operation);

    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toContain('publish');
  });

  it('retries a pending operation once and clears it', () => {
    recovery.remember(operation);
    const replayed: PendingCatalogOperation[] = [];
    const replay = (pending: PendingCatalogOperation): Observable<unknown> => {
      replayed.push(pending);
      return of(undefined);
    };

    recovery.resumeIfPending(replay);

    expect(replayed).toEqual([operation]);
    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toBeNull();
  });

  it('does nothing while there is no session', () => {
    authenticated = false;
    recovery.remember(operation);
    const replay = vi.fn(() => of(undefined));

    recovery.resumeIfPending(replay);

    expect(replay).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).not.toBeNull();
  });

  it('discards the intention when the retry fails again', () => {
    recovery.remember(operation);

    recovery.resumeIfPending(() => throwError(() => new Error('unauthorized')));

    expect(sessionStorage.getItem(CATALOG_STORAGE_KEYS.pendingOperation)).toBeNull();
  });
});
