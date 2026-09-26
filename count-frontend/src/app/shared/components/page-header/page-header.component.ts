import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageHeaderComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly showBack = input<boolean>(true);
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
