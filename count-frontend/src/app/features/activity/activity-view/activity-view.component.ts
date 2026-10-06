import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { interval, startWith, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ActivityService } from '../../../core/services/activity.service';
import { Activity, ACTIVITY_ICONS } from '../../../core/models/activity.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { GroupStore } from '../../groups/group-detail/group-store';

const POLL_INTERVAL_MS = 20_000;

@Component({
  selector: 'app-activity-view',
  standalone: true,
  imports: [DatePipe, MatIconModule, LoadingSpinnerComponent, EmptyStateComponent, AnimateInDirective],
  templateUrl: './activity-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityViewComponent implements OnInit {
  private readonly activityService = inject(ActivityService);
  protected readonly groupStore = inject(GroupStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly activities = signal<Activity[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly icons = ACTIVITY_ICONS;

  ngOnInit(): void {
    // Polls instead of pushing over a socket: a feed that's at most ~20s stale is plenty for
    // "who did what", and this avoids a WebSocket/STOMP stack for a feature that doesn't need
    // sub-second latency. Stops automatically when the tab/component is destroyed.
    interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => {
          const groupId = this.groupStore.group()?.id;
          return groupId ? this.activityService.list(groupId) : [];
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: page => {
          this.activities.set(page.content);
          this.loading.set(false);
          this.error.set(null);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Impossible de charger l’activité du groupe.');
        }
      });
  }
}
