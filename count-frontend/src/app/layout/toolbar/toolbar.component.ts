import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ParticipantAvatarComponent } from '../../shared/components/participant-avatar/participant-avatar.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [RouterLink, MatToolbarModule, MatIconModule, MatButtonModule, MatMenuModule, ParticipantAvatarComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  protected logout(): void {
    this.authService.logout();
  }
}
