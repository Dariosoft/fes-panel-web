import { AbstractControl, ValidationErrors } from '@angular/forms';
import { SHOP_NAME_MAX_LENGTH, SHOP_NAME_MIN_LENGTH } from '../../core/constants/shop-limits';

export function shopNameValidator(control: AbstractControl): ValidationErrors | null {
  const length = ((control.value as string | null) ?? '').trim().length;

  if (length < SHOP_NAME_MIN_LENGTH) {
    return { required: true };
  }
  if (length > SHOP_NAME_MAX_LENGTH) {
    return { maxLength: true };
  }
  return null;
}
