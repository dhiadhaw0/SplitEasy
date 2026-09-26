import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ExpenseService } from '../../../core/services/expense.service';
import { StatsService } from '../../../core/services/stats.service';
import { Expense } from '../../../core/models/expense.model';
import { CATEGORIES, CATEGORY_LABELS, Category } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { GroupStore } from '../../groups/group-detail/group-store';
import { ExpenseItemComponent } from '../expense-item/expense-item.component';

interface ExpenseGroupByDate {
  label: string;
  expenses: Expense[];
}

const PAGE_SIZE = 20;

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MoneyDisplayComponent,
    ExpenseItemComponent,
    AnimateInDirective
  ],
  templateUrl: './expense-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseListComponent {
  private readonly expenseService = inject(ExpenseService);
  private readonly statsService = inject(StatsService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupStore = inject(GroupStore);

  protected readonly categories = CATEGORIES;
  protected readonly categoryLabels = CATEGORY_LABELS;

  protected readonly categoryFilter = signal<Category | null>(null);
  protected readonly participantFilter = signal<number | null>(null);

  protected readonly expenses = signal<Expense[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly loading = signal(true);
  protected readonly loadingMore = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly groupTotal = signal<number | null>(null);
  protected readonly myConsumed = signal<number | null>(null);

  protected readonly hasMore = computed(() => this.page() + 1 < this.totalPages());

  protected readonly groupedExpenses = computed<ExpenseGroupByDate[]>(() => {
    const groups: ExpenseGroupByDate[] = [];
    for (const expense of this.expenses()) {
      const label = dateLabel(expense.date);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.expenses.push(expense);
      } else {
        groups.push({ label, expenses: [expense] });
      }
    }
    return groups;
  });

  private readonly groupId = computed(() => this.groupStore.group()?.id ?? null);

  constructor() {
    effect(() => {
      const groupId = this.groupId();
      const category = this.categoryFilter();
      const participantId = this.participantFilter();
      if (groupId != null) {
        this.resetAndLoad(groupId, category, participantId);
      }
    });

    effect(() => {
      const groupId = this.groupId();
      if (groupId != null) {
        this.loadTotals(groupId);
      }
    });
  }

  protected loadMore(): void {
    const groupId = this.groupId();
    if (groupId == null || this.loadingMore()) {
      return;
    }
    this.loadPage(groupId, this.page() + 1, this.categoryFilter(), this.participantFilter(), true);
  }

  protected addExpense(): void {
    const groupId = this.groupId();
    if (groupId != null) {
      this.router.navigate(['/groups', groupId, 'expenses', 'new']);
    }
  }

  protected openExpense(expenseId: number): void {
    const groupId = this.groupId();
    if (groupId != null) {
      this.router.navigate(['/groups', groupId, 'expenses', expenseId]);
    }
  }

  private resetAndLoad(groupId: number, category: Category | null, participantId: number | null): void {
    this.expenses.set([]);
    this.page.set(0);
    this.loadPage(groupId, 0, category, participantId, false);
  }

  private loadPage(groupId: number, page: number, category: Category | null, participantId: number | null, append: boolean): void {
    const loadingSignal = append ? this.loadingMore : this.loading;
    loadingSignal.set(true);
    this.error.set(null);

    this.expenseService.list(groupId, { page, size: PAGE_SIZE, category, participantId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.expenses.update(current => (append ? [...current, ...result.content] : result.content));
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          loadingSignal.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger les dépenses.');
          loadingSignal.set(false);
        }
      });
  }

  private loadTotals(groupId: number): void {
    this.statsService.getStats(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(stats => {
        this.groupTotal.set(stats.totalSpent);
        const myParticipantId = this.groupStore.myParticipantId();
        const mine = stats.byParticipant.find(p => p.participantId === myParticipantId);
        this.myConsumed.set(mine?.consumed ?? 0);
      });
  }
}

function dateLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(date, today)) {
    return "Aujourd'hui";
  }
  if (isSameDay(date, yesterday)) {
    return 'Hier';
  }
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
