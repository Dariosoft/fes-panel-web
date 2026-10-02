import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductImages } from '../../core/components/product-images/product-images';
import { Currency, EditableProduct, ProductImage } from '../../core/models/catalog-product';
import { Catalog } from '../../core/services/catalog/catalog';
import { Session } from '../../core/services/session/session';

@Component({
  selector: 'app-catalog-form-view',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ProductImages],
  templateUrl: './catalog-form.html',
  host: { class: 'flex flex-col gap-4' },
})
export class CatalogFormView implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(Catalog);
  private readonly session = inject(Session);

  readonly authenticated = this.session.authenticated;
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly images = signal<ProductImage[]>([]);

  readonly form = this.formBuilder.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: ['ARS' as Currency, Validators.required],
    stock: [null as number | null, Validators.min(0)],
  });

  private productId?: string;

  get heading(): string {
    return this.productId ? 'Editar producto' : 'Nuevo producto';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.productId = id;
    this.catalog.getProduct(id).subscribe({
      next: (product) => {
        if (!product) {
          this.loadError.set('No encontramos el producto que querés editar.');
          return;
        }
        this.productId = product.id;
        this.images.set(product.images);
        this.form.patchValue({
          name: product.name,
          price: product.price,
          currency: product.currency,
          stock: product.stock ?? null,
        });
      },
      error: () => this.loadError.set('No se pudo cargar el producto.'),
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const product: EditableProduct = {
      id: this.productId,
      name: value.name ?? '',
      price: value.price ?? 0,
      currency: value.currency ?? 'ARS',
      stock: value.stock ?? undefined,
      images: this.images(),
    };

    this.saving.set(true);
    this.saveError.set(null);
    this.catalog.save(product).subscribe({
      next: () => {
        this.saving.set(false);
        void this.router.navigate(['/catalog']);
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('No se pudo guardar el producto. Intentá nuevamente.');
      },
    });
  }
}
