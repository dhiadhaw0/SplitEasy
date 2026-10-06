import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnimateInDirective } from '../../directives/animate-in.directive';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, AnimateInDirective],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly showBack = input<boolean>(true);
  /**
   * Pairs this header's title with a same-named element on the page navigated *from* (e.g. a
   * list card) so the native View Transitions API morphs one into the other instead of just
   * cross-fading. Give it a value unique to the specific record, e.g. `'group-title-' + group.id`.
   */
  readonly transitionName = input<string | undefined>();
  /** Optional explicit route to navigate back to; falls back to browser history. */
  readonly backRoute = input<string | undefined>();

  readonly back = output<void>();

  protected goBack(): void {
    this.back.emit();
    if (this.backRoute()) {
      this.router.navigateByUrl(this.backRoute()!);
    } else {
      this.location.back();
    }
  }
}
