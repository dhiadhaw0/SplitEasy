import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { RouteFadeDirective } from '../../shared/directives/route-fade.directive';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, ToolbarComponent, RouteFadeDirective],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
}
