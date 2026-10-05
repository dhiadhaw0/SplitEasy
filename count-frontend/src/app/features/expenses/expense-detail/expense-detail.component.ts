import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ExpenseService } from '../../../core/services/expense.service';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ExchangeRateService } from '../../../core/services/exchange-rate.service';
import { Expense } from '../../../core/models/expense.model';
import { ExchangeRateHistory } from '../../../core/models/exchange-rate.model';
import { Currency, CATEGORY_COLORS, RECURRENCE_INTERVAL_LABELS } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';
import { CategoryIconPipe } from '../../../shared/pipes/category-icon.pipe';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    MoneyDisplayComponent,
    ParticipantAvatarComponent,
    AnimateInDirective,
    CategoryLabelPipe,
    CategoryIconPipe
  ],
  templateUrl: './expense-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseDetailComponent {
  private readonly expenseService = inject(ExpenseService);
  private readonly groupService = inject(GroupService);
  private readonly notification = inject(NotificationService);
  private readonly exchangeRateService = inject(ExchangeRateService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly groupId = input.required<string>();
  readonly expenseId = input.required<string>();

  protected readonly expense = signal<Expense | null>(null);
  protected readonly currency = signal<Currency>('EUR');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly deleting = signal(false);
  protected readonly rateHistory = signal<ExchangeRateHistory | null>(null);
  protected readonly loadingHistory = signal(false);

  protected readonly categoryColors = CATEGORY_COLORS;
  protected readonly recurrenceIntervalLabels = RECURRENCE_INTERVAL_LABELS;

  protected readonly historyChartData = computed<ChartData<'line', number[], string>>(() => {
    const points = this.rateHistory()?.points ?? [];
    return {
      labels: points.map(p => new Date(`${p.date}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        data: points.map(p => p.rate),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 0
      }]
    };
  });

  protected readonly historyChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { x: { display: false }, y: { ticks: { maxTicksLimit: 4 } } }
  };

  constructor() {
    effect(() => {
      const groupId = Number(this.groupId());
      const expenseId = Number(this.expenseId());
      if (!Number.isNaN(groupId) && !Number.isNaN(expenseId)) {
        this.load(groupId, expenseId);
      }
    }, { allowSignalWrites: true });
  }

  private load(groupId: number, expenseId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.rateHistory.set(null);

    forkJoin({
      group: this.groupService.getGroup(groupId),
      expense: this.expenseService.get(groupId, expenseId)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ group, expense }) => {
          this.currency.set(group.currency);
          this.expense.set(expense);
          this.loading.set(false);
          if (expense.originalCurrency) {
            this.loadHistory(expense.originalCurrency, group.currency);
          }
        },
        error: () => {
          this.error.set('Impossible de charger cette dépense.');
          this.loading.set(false);
        }
      });
  }

  private loadHistory(from: Currency, to: Currency): void {
    this.loadingHistory.set(true);
    this.exchangeRateService.getHistory(from, to)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: history => {
          this.rateHistory.set(history);
          this.loadingHistory.set(false);
        },
        error: () => this.loadingHistory.set(false)
      });
  }

  protected edit(): void {
    this.router.navigate(['/groups', this.groupId(), 'expenses', this.expenseId(), 'edit']);
  }

  protected delete(): void {
    const expense = this.expense();
    if (!expense) {
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer cette dépense ?',
        message: `"${expense.title}" sera définitivement supprimée et les soldes seront recalculés.`,
        confirmLabel: 'Supprimer',
        color: 'warn'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result?.confirmed) {
          return;
        }
        this.deleting.set(true);
        this.expenseService.delete(Number(this.groupId()), expense.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.notification.success('Dépense supprimée.');
              this.router.navigate(['/groups', this.groupId(), 'expenses']);
            },
            error: () => this.deleting.set(false)
          });
      });
  }
}
