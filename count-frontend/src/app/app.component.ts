import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  // Injected here (not just by the landing page's theme toggle) so `data-theme` gets set on
  // <html> for every route, including the native app shell, which never renders that toggle.
  private readonly themeService = inject(ThemeService);
}
