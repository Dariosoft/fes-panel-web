import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { startWith } from 'rxjs';
import { ConfirmDialog } from '../../core/components/confirm-dialog/confirm-dialog';
import { SHOP_DESCRIPTION_MAX_LENGTH } from '../../core/constants/shop-limits';
import { PageLayout } from '../../core/layouts/page-layout/page-layout';
import { Shop } from '../../core/models/shop';
import { Session } from '../../core/services/session/session';
import { ShopStore } from '../../core/services/shop/shop-store';
import { shopNameValidator } from './shop-form.validators';

interface ShopFormValue {
  name: string | null;
  description: string | null;
}

const EMPTY_SHOP: Shop = { name: '', description: null };

function normalizeShop(value: Partial<ShopFormValue> | null): Shop {
  const name = (value?.name ?? '').trim();
  const description = (value?.description ?? '').trim();

  return { name, description: description.length > 0 ? description : null };
}

function sameShop(left: Shop | null, right: Shop | null): boolean {
  const leftShop = left ?? EMPTY_SHOP;
  const rightShop = right ?? EMPTY_SHOP;

  return (
    leftShop.name === rightShop.name && leftShop.description === rightShop.description
  );
}

@Component({
  selector: 'app-shop-view',
  standalone: true,
  imports: [ReactiveFormsModule, PageLayout, ConfirmDialog],
  templateUrl: './shop.html',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class ShopView implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly session = inject(Session);
  readonly store = inject(ShopStore);

  readonly authenticated = this.session.authenticated;
  readonly discardPromptOpen = signal(false);
  private readonly savedSnapshot = signal<Shop | null>(null);

  readonly form = this.formBuilder.group({
    name: ['', shopNameValidator],
    description: ['', Validators.maxLength(SHOP_DESCRIPTION_MAX_LENGTH)],
  });

  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly hasUnsavedChanges = computed(
    () => !sameShop(normalizeShop(this.formValue()), this.savedSnapshot()),
  );

  readonly showForm = computed(
    () =>
      this.authenticated() &&
      !this.store.loading() &&
      !this.store.loadError() &&
      (this.store.notFound() || this.store.shop() !== null),
  );

  private pendingDiscard: Promise<boolean> | null = null;
  private resolveDiscard: ((confirmed: boolean) => void) | null = null;

  constructor() {
    effect(() => {
      const shop = this.store.shop();
      const notFound = this.store.notFound();

      if (shop) {
        this.applyShop(shop);
        return;
      }
      if (notFound) {
        this.applyShop(null);
      }
    });
  }

  ngOnInit(): void {
    if (this.session.authenticated()) {
      this.store.load();
    }
  }

  retry(): void {
    this.store.retry();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.store.save(normalizeShop(this.form.getRawValue())).subscribe({
      error: () => undefined,
    });
  }

  confirmDiscard(): boolean | Promise<boolean> {
    if (!this.authenticated() || !this.hasUnsavedChanges()) {
      return true;
    }

    if (!this.pendingDiscard) {
      this.pendingDiscard = new Promise<boolean>((resolve) => {
        this.resolveDiscard = resolve;
        this.discardPromptOpen.set(true);
      });
    }

    return this.pendingDiscard;
  }

  onDiscardConfirmed(): void {
    this.settleDiscard(true);
  }

  onDiscardCancelled(): void {
    this.settleDiscard(false);
  }

  private settleDiscard(confirmed: boolean): void {
    if (!this.pendingDiscard) {
      return;
    }

    this.discardPromptOpen.set(false);
    const resolve = this.resolveDiscard;
    this.pendingDiscard = null;
    this.resolveDiscard = null;
    resolve?.(confirmed);
  }

  private applyShop(shop: Shop | null): void {
    const normalized = shop ? normalizeShop(shop) : null;
    this.savedSnapshot.set(normalized);
    this.form.setValue({
      name: normalized?.name ?? '',
      description: normalized?.description ?? '',
    });
  }
}
