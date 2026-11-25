import { Signal, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Shop } from '../../core/models/shop';
import { Session } from '../../core/services/session/session';
import { SHOP_LOAD_ERROR_MESSAGE, SHOP_SAVE_ERROR_MESSAGE, ShopStore } from '../../core/services/shop/shop-store';
import { ShopView } from './shop';

describe('ShopView', () => {
  let fixture: ComponentFixture<ShopView>;
  let shopSignal: WritableSignal<Shop | null>;
  let loadingSignal: WritableSignal<boolean>;
  let loadErrorSignal: WritableSignal<string | null>;
  let notFoundSignal: WritableSignal<boolean>;
  let savingSignal: WritableSignal<boolean>;
  let saveErrorSignal: WritableSignal<string | null>;
  let savedSignal: WritableSignal<boolean>;
  let store: {
    shop: Signal<Shop | null>;
    loading: Signal<boolean>;
    loadError: Signal<string | null>;
    notFound: Signal<boolean>;
    saving: Signal<boolean>;
    saveError: Signal<string | null>;
    saved: Signal<boolean>;
    load: ReturnType<typeof vi.fn>;
    retry: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let authenticated: boolean;
  let enterWithGoogle: ReturnType<typeof vi.fn>;

  const shop: Shop = { name: 'Mi tienda', description: 'Productos artesanales' };

  const configure = async (): Promise<void> => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Session, useValue: { authenticated: () => authenticated, enterWithGoogle } },
        { provide: ShopStore, useValue: store },
      ],
    });
    fixture = TestBed.createComponent(ShopView);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const text = (): string => fixture.nativeElement.textContent as string;

  const findButton = (label: string): HTMLButtonElement => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const found = buttons.find((button) => button.textContent?.trim() === label);
    if (!found) {
      throw new Error(`No se encontró el botón ${label}`);
    }
    return found;
  };

  beforeEach(() => {
    shopSignal = signal<Shop | null>(null);
    loadingSignal = signal(false);
    loadErrorSignal = signal<string | null>(null);
    notFoundSignal = signal(false);
    savingSignal = signal(false);
    saveErrorSignal = signal<string | null>(null);
    savedSignal = signal(false);
    store = {
      shop: shopSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      loadError: loadErrorSignal.asReadonly(),
      notFound: notFoundSignal.asReadonly(),
      saving: savingSignal.asReadonly(),
      saveError: saveErrorSignal.asReadonly(),
      saved: savedSignal.asReadonly(),
      load: vi.fn(),
      retry: vi.fn(),
      save: vi.fn(() => of(shop)),
    };
    authenticated = true;
    enterWithGoogle = vi.fn();
  });

  it('asks to sign in and skips loading without a session', async () => {
    authenticated = false;
    await configure();

    expect(store.load).not.toHaveBeenCalled();
    expect(text()).toContain('Iniciá sesión para gestionar tu tienda.');
    expect(fixture.nativeElement.querySelector('#shop-form')).toBeNull();

    findButton('Entrar con Google').click();
    expect(enterWithGoogle).toHaveBeenCalled();
  });

  it('shows an accessible loading state', async () => {
    loadingSignal.set(true);
    await configure();

    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;
    expect(status?.textContent).toContain('Cargando tu tienda…');
    expect(status?.getAttribute('aria-busy')).toBe('true');
  });

  it('shows the empty state with the creation form when there is no shop', async () => {
    notFoundSignal.set(true);
    await configure();

    expect(text()).toContain('Todavía no tenés una tienda configurada');
    expect(fixture.nativeElement.querySelector('#shop-form')).not.toBeNull();
  });

  it('prefills the form with the loaded shop', async () => {
    shopSignal.set(shop);
    await configure();

    const name = fixture.nativeElement.querySelector('#shop-name') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector(
      '#shop-description',
    ) as HTMLTextAreaElement;

    expect(name.value).toBe('Mi tienda');
    expect(description.value).toBe('Productos artesanales');
    expect(description.getAttribute('maxlength')).toBe('1000');
  });

  it('validates the trimmed shop name between 1 and 80 characters', async () => {
    notFoundSignal.set(true);
    await configure();
    const component = fixture.componentInstance;

    component.form.controls.name.setValue('   ');
    expect(component.form.controls.name.invalid).toBe(true);

    component.form.controls.name.setValue(`${'a'.repeat(78)}  `);
    expect(component.form.controls.name.valid).toBe(true);

    component.form.controls.name.setValue('a'.repeat(80));
    expect(component.form.controls.name.valid).toBe(true);

    component.form.controls.name.setValue('a'.repeat(81));
    expect(component.form.controls.name.invalid).toBe(true);
  });

  it('blocks saving an empty name and shows the Spanish validation message', async () => {
    notFoundSignal.set(true);
    await configure();

    fixture.componentInstance.form.controls.name.setValue('   ');
    fixture.componentInstance.save();
    fixture.detectChanges();

    expect(store.save).not.toHaveBeenCalled();
    expect(text()).toContain('Ingresá el nombre de tu tienda (entre 1 y 80 caracteres).');
  });

  it('accepts a 1000 character description and rejects 1001', async () => {
    notFoundSignal.set(true);
    await configure();
    const component = fixture.componentInstance;

    component.form.controls.description.setValue('a'.repeat(1000));
    expect(component.form.controls.description.valid).toBe(true);

    component.form.controls.description.setValue('a'.repeat(1001));
    expect(component.form.controls.description.invalid).toBe(true);
  });

  it('blocks saving an overlong description with the limit message', async () => {
    notFoundSignal.set(true);
    await configure();
    const component = fixture.componentInstance;

    component.form.patchValue({ name: 'Mi tienda', description: 'a'.repeat(1001) });
    component.save();
    fixture.detectChanges();

    expect(store.save).not.toHaveBeenCalled();
    expect(text()).toContain('La descripción no puede superar los 1000 caracteres.');
  });

  it('saves the normalized name and description', async () => {
    notFoundSignal.set(true);
    await configure();
    const component = fixture.componentInstance;

    component.form.setValue({ name: '  Mi tienda  ', description: '  Hola  ' });
    component.save();

    expect(store.save).toHaveBeenCalledWith({ name: 'Mi tienda', description: 'Hola' });
  });

  it('saves an empty description as null', async () => {
    notFoundSignal.set(true);
    await configure();
    const component = fixture.componentInstance;

    component.form.setValue({ name: 'Mi tienda', description: '   ' });
    component.save();

    expect(store.save).toHaveBeenCalledWith({ name: 'Mi tienda', description: null });
  });

  it('shows a confirmation status after a successful save', async () => {
    notFoundSignal.set(true);
    await configure();

    store.save = vi.fn(() => {
      shopSignal.set(shop);
      notFoundSignal.set(false);
      savedSignal.set(true);
      return of(shop);
    });

    fixture.componentInstance.form.setValue({ name: 'Mi tienda', description: 'Hola' });
    fixture.componentInstance.save();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(text()).toContain('Guardaste los datos de tu tienda.');
  });

  it('keeps the entered data when the save fails', async () => {
    shopSignal.set(shop);
    await configure();
    const component = fixture.componentInstance;

    component.form.setValue({ name: 'Tienda editada', description: 'Cambio' });
    store.save = vi.fn(() => throwError(() => new Error('boom')));
    component.save();

    saveErrorSignal.set(SHOP_SAVE_ERROR_MESSAGE);
    savingSignal.set(false);
    fixture.detectChanges();

    expect(component.form.value).toEqual({ name: 'Tienda editada', description: 'Cambio' });
    expect(text()).toContain(SHOP_SAVE_ERROR_MESSAGE);
  });

  it('shows the load error and retries', async () => {
    loadErrorSignal.set(SHOP_LOAD_ERROR_MESSAGE);
    await configure();

    expect(text()).toContain(SHOP_LOAD_ERROR_MESSAGE);
    findButton('Reintentar').click();

    expect(store.retry).toHaveBeenCalled();
  });

  it('allows leaving without changes', async () => {
    shopSignal.set(shop);
    await configure();

    expect(fixture.componentInstance.confirmDiscard()).toBe(true);
  });

  it('asks for confirmation and leaves when discarded', async () => {
    shopSignal.set(shop);
    await configure();
    const component = fixture.componentInstance;

    component.form.controls.name.setValue('Otra tienda');
    const decision = component.confirmDiscard() as Promise<boolean>;

    expect(decision).toBeInstanceOf(Promise);
    expect(component.discardPromptOpen()).toBe(true);

    component.onDiscardConfirmed();

    await expect(decision).resolves.toBe(true);
    expect(component.discardPromptOpen()).toBe(false);
  });

  it('stays on the screen when the discard is cancelled', async () => {
    shopSignal.set(shop);
    await configure();
    const component = fixture.componentInstance;

    component.form.controls.name.setValue('Otra tienda');
    const decision = component.confirmDiscard() as Promise<boolean>;

    component.onDiscardCancelled();

    await expect(decision).resolves.toBe(false);
  });

  it('reuses the pending discard confirmation instead of opening twice', async () => {
    shopSignal.set(shop);
    await configure();
    const component = fixture.componentInstance;

    component.form.controls.name.setValue('Otra tienda');
    const first = component.confirmDiscard() as Promise<boolean>;
    const second = component.confirmDiscard() as Promise<boolean>;

    expect(second).toBe(first);

    component.onDiscardConfirmed();
    await expect(first).resolves.toBe(true);
  });
});
