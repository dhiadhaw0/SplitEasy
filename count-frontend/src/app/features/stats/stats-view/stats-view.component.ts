import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { StatsService } from '../../../core/services/stats.service';
import { GroupStats } from '../../../core/models/stats.model';
import { CATEGORY_LABELS } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { GroupStore } from '../../groups/group-detail/group-store';

const CATEGORY_COLORS = ['#00897b', '#3949ab', '#8e24aa', '#d81b60', '#f4511e', '#6d4c41', '#00acc1', '#7cb342'];
const PAID_COLOR = '#00897b';
const CONSUMED_COLOR = '#8e24aa';

@Component({
  selector: 'app-stats-view',
  standalone: true,
  imports: [MatCardModule, BaseChartDirective, LoadingSpinnerComponent, EmptyStateComponent, MoneyDisplayComponent],
  templateUrl: './stats-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsViewComponent {
  private readonly statsService = inject(StatsService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupStore = inject(GroupStore);

  protected readonly stats = signal<GroupStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  private readonly groupId = computed(() => this.groupStore.group()?.id ?? null);

  protected readonly hasExpenses = computed(() => (this.stats()?.expenseCount ?? 0) > 0);

  protected readonly doughnutData = computed<ChartData<'doughnut', number[], string>>(() => {
    const byCategory = this.stats()?.byCategory ?? {};
    const entries = Object.entries(byCategory) as [keyof typeof CATEGORY_LABELS, number][];
    return {
      labels: entries.map(([category]) => CATEGORY_LABELS[category]),
      datasets: [{ data: entries.map(([, amount]) => amount), backgroundColor: CATEGORY_COLORS }]
    };
  });

  protected readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } }
  };

  protected readonly barData = computed<ChartData<'bar', number[], string>>(() => {
    const byParticipant = this.stats()?.byParticipant ?? [];
    return {
      labels: byParticipant.map(p => p.name),
      datasets: [
        { data: byParticipant.map(p => p.paid), label: 'Payé', backgroundColor: PAID_COLOR },
        { data: byParticipant.map(p => p.consumed), label: 'Consommé', backgroundColor: CONSUMED_COLOR }
      ]
    };
  });

  protected readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true } }
  };

  constructor() {
    effect(() => {
      const groupId = this.groupId();
      if (groupId != null) {
        this.load(groupId);
      }
    });
  }

  private load(groupId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.statsService.getStats(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.stats.set(stats);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les statistiques.');
          this.loading.set(false);
        }
      });
  }
}
