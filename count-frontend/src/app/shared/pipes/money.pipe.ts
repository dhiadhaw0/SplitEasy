import { Pipe, PipeTransform } from '@angular/core';
import { Currency } from '../../core/models/enums';

@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {

  transform(value: number | null | undefined, currency: Currency = 'EUR'): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '';
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(value);
  }
}
