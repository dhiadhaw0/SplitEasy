import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import confetti from 'canvas-confetti';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { BudgetService } from '../../../core/services/budget.service';
import { SavingsGoalService } from '../../../core/services/savings-goal.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { ExportService } from '../../../core/services/export.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BUDGET_PERIOD_LABELS, Budget } from '../../../core/models/budget.model';
import { SavingsContribution, SavingsGoal } from '../../../core/models/savings-goal.model';
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_LABELS } from '../../../core/models/enums';
import { GroupStore } from '../../groups/group-detail/group-store';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { BudgetFormDialogComponent, BudgetFormDialogData } from '../budget-form-dialog/budget-form-dialog.component';
import { SavingsGoalDialogComponent, SavingsGoalDialogData } from '../savings-goal-dialog/savings-goal-dialog.component';
import { ContributionDialogComponent, ContributionDialogData } from '../contribution-dialog/contribution-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-budget-view',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MoneyDisplayComponent,
    ParticipantAvatarComponent,
    AnimateInDirective
  ],
  templateUrl: './budget-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetViewComponent {
  protected readonly groupStore = inject(GroupStore);
  private readonly budgetService = inject(BudgetService);
  private readonly savingsGoalService = inject(SavingsGoalService);
  private readonly expenseService = inject(ExpenseService);
  private readonly exportService = inject(ExportService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly budgets = signal<Budget[]>([]);
  protected readonly goals = signal<SavingsGoal[]>([]);
  protected readonly loadingBudgets = signal(true);
  protected readonly loadingGoals = signal(true);
  protected readonly expandedGoalId = signal<number | null>(null);
  protected readonly exportingReport = signal(false);

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly categoryIcons = CATEGORY_ICONS;
  protected readonly categoryColors = CATEGORY_COLORS;
  protected readonly periodLabels = BUDGET_PERIOD_LABELS;
  protected readonly min = Math.min;

  constructor() {
    effect(() => {
      const group = this.groupStore.group();
      if (group) {
        this.loadBudgets(group.id);
        this.loadGoals(group.id);
      }
    }, { allowSignalWrites: true });
  }

  private loadBudgets(groupId: number): void {
    this.loadingBudgets.set(true);
    this.budgetService.list(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: budgets => {
          this.budgets.set(budgets);
          this.loadingBudgets.set(false);
        },
        error: () => this.loadingBudgets.set(false)
      });
  }

  private loadGoals(groupId: number): void {
    this.loadingGoals.set(true);
    this.savingsGoalService.list(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: goals => {
          this.goals.set(goals);
          this.loadingGoals.set(false);
        },
        error: () => this.loadingGoals.set(false)
      });
  }

  protected toggleExpanded(goalId: number): void {
    this.expandedGoalId.update(current => (current === goalId ? null : goalId));
  }

  protected openBudgetDialog(budget?: Budget): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const data: BudgetFormDialogData = { groupId: group.id, budget };
    const dialogRef = this.dialog.open<BudgetFormDialogComponent, BudgetFormDialogData, Budget>(BudgetFormDialogComponent, {
      width: '420px',
      data
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.notification.success(budget ? 'Budget mis à jour.' : 'Budget créé.');
          this.loadBudgets(group.id);
        }
      });
  }

  protected deleteBudget(budget: Budget): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer ce budget ?',
        message: 'Cette limite de dépense sera définitivement supprimée.',
        color: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.confirmed) {
          this.budgetService.delete(group.id, budget.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.notification.success('Budget supprimé.');
              this.loadBudgets(group.id);
            });
        }
      });
  }

  protected openGoalDialog(goal?: SavingsGoal): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const data: SavingsGoalDialogData = { groupId: group.id, goal };
    const dialogRef = this.dialog.open<SavingsGoalDialogComponent, SavingsGoalDialogData, SavingsGoal>(SavingsGoalDialogComponent, {
      width: '420px',
      data
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.notification.success(goal ? 'Cagnotte mise à jour.' : 'Cagnotte créée.');
          this.loadGoals(group.id);
        }
      });
  }

  protected deleteGoal(goal: SavingsGoal): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Supprimer cette cagnotte ?',
        message: `"${goal.name}" et toutes ses contributions seront définitivement supprimées.`,
        color: 'warn',
        icon: 'delete_forever'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.confirmed) {
          this.savingsGoalService.delete(group.id, goal.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              this.notification.success('Cagnotte supprimée.');
              this.loadGoals(group.id);
            });
        }
      });
  }

  protected openContributionDialog(goal: SavingsGoal): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const data: ContributionDialogData = {
      groupId: group.id,
      goal,
      participants: this.groupStore.participants(),
      myParticipantId: this.groupStore.myParticipantId()
    };
    const dialogRef = this.dialog.open<ContributionDialogComponent, ContributionDialogData, SavingsGoal>(ContributionDialogComponent, {
      width: '420px',
      data
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.notification.success('Contribution ajoutée !');
          const justAchieved = result.achieved && !goal.achieved;
          this.goals.update(goals => goals.map(g => (g.id === result.id ? result : g)));
          if (justAchieved) {
            this.celebrateGoalAchieved();
          }
        }
      });
  }

  /** Fires once, the moment a cagnotte's contributions cross its target — not on every reload
   * of an already-achieved goal. Same reduced-motion guard as the app's other confetti burst. */
  private celebrateGoalAchieved(): void {
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }
    confetti({
      particleCount: 100,
      spread: 80,
      startVelocity: 35,
      origin: { y: 0.6 },
      colors: ['#8b5cf6', '#ec4899', '#ffb703', '#ff5d8f', '#2dd4bf']
    });
  }

  protected deleteContribution(goal: SavingsGoal, contribution: SavingsContribution): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    this.savingsGoalService.deleteContribution(group.id, goal.id, contribution.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updatedGoal => {
        this.goals.update(goals => goals.map(g => (g.id === updatedGoal.id ? updatedGoal : g)));
      });
  }

  protected exportMonthlyReport(): void {
    const group = this.groupStore.group();
    if (!group || this.exportingReport()) {
      return;
    }

    this.exportingReport.set(true);
    this.expenseService.list(group.id, { size: 10000 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: page => {
          this.exportService.exportMonthlyReport(group, page.content, this.budgets(), this.goals())
            .catch(() => this.notification.error('Impossible de générer le rapport.'))
            .finally(() => this.exportingReport.set(false));
        },
        error: () => {
          this.notification.error('Impossible de charger les dépenses du mois.');
          this.exportingReport.set(false);
        }
      });
  }
}
