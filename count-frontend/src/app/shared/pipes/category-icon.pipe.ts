import { Pipe, PipeTransform } from '@angular/core';
import { CATEGORY_ICONS, Category } from '../../core/models/enums';

@Pipe({ name: 'categoryIcon', standalone: true })
export class CategoryIconPipe implements PipeTransform {

  transform(category: Category | null | undefined): string {
    return category ? CATEGORY_ICONS[category] : 'more_horiz';
  }
}
