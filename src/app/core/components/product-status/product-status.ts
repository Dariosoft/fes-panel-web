import { Component, computed, input } from '@angular/core';
import { PRODUCT_STAGE, ProductStage } from '../../constants/product-stage';

@Component({
  selector: 'app-product-status',
  standalone: true,
  templateUrl: './product-status.html',
})
export class ProductStatus {
  readonly stage = input.required<ProductStage>();

  readonly stageLabel = computed(() =>
    this.stage() === PRODUCT_STAGE.published ? 'Publicado' : 'Borrador',
  );
}
