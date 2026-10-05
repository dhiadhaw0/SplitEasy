import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, map, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ExpenseService } from '../../../core/services/expense.service';
import { StatsService } from '../../../core/services/stats.service';
import { Expense } from '../../../core/models/expense.model';
import { Page } from '../../../core/models/page.model';
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

interface FilterChange {
  groupId: number;
  category: Category | null;
  participantId: number | null;
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

  /**
   * Filter changes are funneled through a Subject + switchMap so that if the user flips
   * category/participant filters quickly, only the response to the LATEST request is ever
   * applied — switchMap cancels/ignores any still-in-flight previous request automatically.
   */
  private readonly filterChange$ = new Subject<FilterChange>();

  constructor() {
    this.filterChange$
      .pipe(
        switchMap(({ groupId, category, participantId }) =>
          this.expenseService.list(groupId, { page: 0, size: PAGE_SIZE, category, participantId }).pipe(
            map(result => ({ ok: true as const, result })),
            catchError(() => of({ ok: false as const, result: null as Page<Expense> | null }))
          )
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(outcome => {
        if (outcome.ok && outcome.result) {
          this.expenses.set(outcome.result.content);
          this.page.set(outcome.result.page);
          this.totalPages.set(outcome.result.totalPages);
          this.error.set(null);
        } else {
          this.error.set('Impossible de charger les dépenses.');
        }
        this.loading.set(false);
      });

    effect(() => {
      const groupId = this.groupId();
      const category = this.categoryFilter();
      const participantId = this.participantFilter();
      if (groupId != null) {
        this.expenses.set([]);
        this.page.set(0);
        this.loading.set(true);
        this.error.set(null);
        this.filterChange$.next({ groupId, category, participantId });
      }
    }, { allowSignalWrites: true });

    effect(() => {
      const groupId = this.groupId();
      if (groupId != null) {
        this.loadTotals(groupId);
      }
    }, { allowSignalWrites: true });
  }

  protected loadMore(): void {
    const groupId = this.groupId();
    if (groupId == null || this.loadingMore()) {
      return;
    }

    this.loadingMore.set(true);
    this.expenseService
      .list(groupId, { page: this.page() + 1, size: PAGE_SIZE, category: this.categoryFilter(), participantId: this.participantFilter() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.expenses.update(current => [...current, ...result.content]);
          this.page.set(result.page);
          this.totalPages.set(result.totalPages);
          this.loadingMore.set(false);
        },
        error: () => this.loadingMore.set(false)
      });
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
