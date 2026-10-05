import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { BalanceService } from '../../../core/services/balance.service';
import { ReminderService } from '../../../core/services/reminder.service';
import { Balance, Settlement } from '../../../core/models/balance.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { GroupStore } from '../../groups/group-detail/group-store';
import { SettlementListComponent } from '../settlement-list/settlement-list.component';

@Component({
  selector: 'app-balance-view',
  standalone: true,
  imports: [
    MatIconModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MoneyDisplayComponent,
    ParticipantAvatarComponent,
    SettlementListComponent,
    AnimateInDirective
  ],
  templateUrl: './balance-view.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceViewComponent {
  private readonly balanceService = inject(BalanceService);
  private readonly reminderService = inject(ReminderService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupStore = inject(GroupStore);

  protected readonly balances = signal<Balance[]>([]);
  protected readonly settlements = signal<Settlement[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly maxAbsBalance = computed(() => Math.max(1, ...this.balances().map(b => Math.abs(b.balance))));

  private readonly groupId = computed(() => this.groupStore.group()?.id ?? null);

  constructor() {
    effect(() => {
      const groupId = this.groupId();
      if (groupId != null) {
        this.loadAll(groupId);
      }
    }, { allowSignalWrites: true });
  }

  protected leftWidthPercent(balance: Balance): number {
    return balance.balance < 0 ? (Math.abs(balance.balance) / this.maxAbsBalance()) * 100 : 0;
  }

  protected rightWidthPercent(balance: Balance): number {
    return balance.balance > 0 ? (Math.abs(balance.balance) / this.maxAbsBalance()) * 100 : 0;
  }

  protected onSettlementRecorded(): void {
    const groupId = this.groupId();
    if (groupId != null) {
      this.loadAll(groupId);
    }
  }

  private loadAll(groupId: number): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      balances: this.balanceService.getBalances(groupId),
      settlements: this.balanceService.getSettlements(groupId)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ balances, settlements }) => {
          this.balances.set(balances);
          this.settlements.set(settlements);
          this.loading.set(false);
          this.updateReminder(groupId, balances);
        },
        error: () => {
          this.error.set('Impossible de charger les soldes.');
          this.loading.set(false);
        }
      });
  }

  private updateReminder(groupId: number, balances: Balance[]): void {
    const group = this.groupStore.group();
    const myParticipantId = this.groupStore.myParticipantId();
    if (!group || myParticipantId == null) {
      return;
    }
    const myBalance = balances.find(b => b.participantId === myParticipantId)?.balance ?? 0;
    void this.reminderService.scheduleBalanceReminder(groupId, group.name, myBalance, group.currency);
  }
}
