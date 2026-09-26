import { Pipe, PipeTransform } from '@angular/core';
import { CATEGORY_LABELS, Category } from '../../core/models/enums';

@Pipe({ name: 'categoryLabel', standalone: true })
export class CategoryLabelPipe implements PipeTransform {

  transform(category: Category | null | undefined): string {
    return category ? CATEGORY_LABELS[category] : '';
  }
}
