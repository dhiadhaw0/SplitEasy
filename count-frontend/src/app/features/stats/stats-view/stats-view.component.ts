import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartData, Plugin } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../../core/services/stats.service';
import { GroupStats } from '../../../core/models/stats.model';
import { CATEGORY_LABELS } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { GroupStore } from '../../groups/group-detail/group-store';

const CATEGORY_COLORS = ['#8b5cf6', '#ec4899', '#ffb703', '#0d9488', '#ff5d8f', '#3b82f6', '#2dd4bf', '#f97316'];
const PAID_COLOR = '#8b5cf6';
const CONSUMED_COLOR = '#ff5d8f';

/** Draws the segment total as a big number in the middle of the doughnut, gauge-style. */
const centerTotalPlugin: Plugin<'doughnut'> = {
  id: 'centerTotal',
  beforeDraw(chart) {
    const total = (chart.data.datasets[0]?.data as number[] ?? []).reduce((sum, value) => sum + value, 0);
    if (total <= 0) {
      return;
    }
    const { ctx, chartArea } = chart;
    const centerX = (chartArea.left + chartArea.right) / 2;
    const centerY = (chartArea.top + chartArea.bottom) / 2;
    const rootStyle = getComputedStyle(document.documentElement);
    const inkColor = rootStyle.getPropertyValue('--se-ink').trim() || '#2a2250';
    const mutedColor = rootStyle.getPropertyValue('--se-muted').trim() || '#7a7196';

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = inkColor;
    ctx.font = '700 22px "Bricolage Grotesque", system-ui, sans-serif';
    ctx.fillText(Math.round(total).toLocaleString('fr-FR'), centerX, centerY - 8);
    ctx.fillStyle = mutedColor;
    ctx.font = '600 11px "Nunito Sans", system-ui, sans-serif';
    ctx.fillText('AU TOTAL', centerX, centerY + 14);
    ctx.restore();
  }
};

@Component({
  selector: 'app-stats-view',
  standalone: true,
  imports: [MatCardModule, MatIconModule, BaseChartDirective, LoadingSpinnerComponent, EmptyStateComponent, MoneyDisplayComponent, AnimateInDirective],
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
    cutout: '70%',
    plugins: { legend: { position: 'bottom' } }
  };

  protected readonly doughnutPlugins = [centerTotalPlugin];

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
    }, { allowSignalWrites: true });
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
