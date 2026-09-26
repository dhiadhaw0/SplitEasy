import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { ExpenseService } from '../../../core/services/expense.service';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Expense } from '../../../core/models/expense.model';
import { Currency } from '../../../core/models/enums';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { CategoryLabelPipe } from '../../../shared/pipes/category-label.pipe';
import { CategoryIconPipe } from '../../../shared/pipes/category-icon.pipe';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    MoneyDisplayComponent,
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

  protected readonly shareColumns = ['participant', 'amount'];

  constructor() {
    effect(() => {
      const groupId = Number(this.groupId());
      const expenseId = Number(this.expenseId());
      if (!Number.isNaN(groupId) && !Number.isNaN(expenseId)) {
        this.load(groupId, expenseId);
      }
    });
  }

  private load(groupId: number, expenseId: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupService.getGroup(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(group => this.currency.set(group.currency));

    this.expenseService.get(groupId, expenseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: expense => {
          this.expense.set(expense);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger cette dépense.');
          this.loading.set(false);
        }
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
