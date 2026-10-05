import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GroupService } from '../../../core/services/group.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OcrService } from '../../../core/services/ocr.service';
import { BudgetService } from '../../../core/services/budget.service';
import { GroupDetail } from '../../../core/models/group.model';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  Category,
  CURRENCIES,
  Currency,
  RECURRENCE_INTERVALS,
  RECURRENCE_INTERVAL_LABELS,
  RecurrenceInterval,
  SPLIT_TYPE_LABELS,
  SplitType
} from '../../../core/models/enums';
import { ComputedShare, ShareInput, computeRemainingAmount, computeRemainingPercentage, computeShares } from '../../../core/utils/split-calculator';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';

interface ShareRowValue {
  participantId: number;
  included: boolean;
  value: number | null;
}

interface ExpenseFormValue {
  title: string;
  amount: number;
  date: Date;
  category: Category;
  paidById: number | null;
  splitType: SplitType;
  shares: ShareRowValue[];
  recurring: boolean;
  recurrenceInterval: RecurrenceInterval | null;
  currency: Currency | null;
}

function createShareRow(fb: FormBuilder, participantId: number, included = true, value: number | null = null) {
  return fb.nonNullable.group({
    participantId: [participantId],
    included: [included],
    value: [value as number | null]
  });
}

type ShareRowForm = ReturnType<typeof createShareRow>;

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    LoadingSpinnerComponent,
    PageHeaderComponent,
    ParticipantAvatarComponent,
    MoneyDisplayComponent,
    AnimateInDirective
  ],
  templateUrl: './expense-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpenseFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly expenseService = inject(ExpenseService);
  private readonly notification = inject(NotificationService);
  private readonly ocrService = inject(OcrService);
  private readonly budgetService = inject(BudgetService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Bound from route params via withComponentInputBinding(). expenseId is only present on the edit route.
  readonly groupId = input.required<string>();
  readonly expenseId = input<string>();

  protected readonly categories = CATEGORIES;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly categoryColors = CATEGORY_COLORS;
  protected readonly categoryIcons = CATEGORY_ICONS;
  protected readonly splitTypeLabels = SPLIT_TYPE_LABELS;
  protected readonly splitTypes: SplitType[] = ['EQUAL', 'AMOUNTS', 'SHARES', 'PERCENTAGES'];
  protected readonly recurrenceIntervals = RECURRENCE_INTERVALS;
  protected readonly recurrenceIntervalLabels = RECURRENCE_INTERVAL_LABELS;
  protected readonly currencies = CURRENCIES;

  protected readonly isEditMode = computed(() => this.expenseId() !== undefined);

  protected readonly loadingInitial = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly scanning = signal(false);
  protected readonly group = signal<GroupDetail | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(100)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    date: [new Date(), [Validators.required]],
    category: ['OTHER' as Category, [Validators.required]],
    paidById: [null as number | null, [Validators.required]],
    splitType: ['EQUAL' as SplitType, [Validators.required]],
    shares: this.fb.array<ShareRowForm>([]),
    recurring: [false],
    recurrenceInterval: [null as RecurrenceInterval | null],
    currency: [null as Currency | null]
  });

  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue()
  }) as unknown as () => ExpenseFormValue;

  // `FormGroup.valid` is a plain getter, not a signal: reading it directly inside a computed()
  // would never re-trigger that computed when the user types (only when some OTHER tracked
  // signal happens to change too). `statusChanges` -> signal makes form validity reactive.
  private readonly formStatus = toSignal(this.form.statusChanges, { initialValue: this.form.status });

  protected readonly includedShareInputs = computed<ShareInput[]>(() =>
    this.formValue().shares.filter(s => s.included).map(s => ({ participantId: s.participantId, value: s.value }))
  );

  protected readonly previewShares = computed<ComputedShare[]>(() => {
    const value = this.formValue();
    if (this.includedShareInputs().length === 0 || !(value.amount > 0)) {
      return [];
    }
    return computeShares(value.amount, value.splitType, this.includedShareInputs());
  });

  protected readonly remainingAmount = computed(() => computeRemainingAmount(this.formValue().amount, this.includedShareInputs()));
  protected readonly remainingPercentage = computed(() => computeRemainingPercentage(this.includedShareInputs()));

  protected readonly atLeastOneIncluded = computed(() => this.includedShareInputs().length > 0);

  protected readonly sharesAreValid = computed(() => {
    if (!this.atLeastOneIncluded()) {
      return false;
    }
    const splitType = this.formValue().splitType;
    const inputs = this.includedShareInputs();
    switch (splitType) {
      case 'EQUAL':
        return true;
      case 'AMOUNTS':
        return Math.abs(this.remainingAmount()) < 0.005 && inputs.every(s => (s.value ?? -1) >= 0);
      case 'SHARES':
        return inputs.every(s => (s.value ?? 0) > 0);
      case 'PERCENTAGES':
        return Math.abs(this.remainingPercentage()) < 0.005 && inputs.every(s => (s.value ?? -1) >= 0);
    }
  });

  protected readonly recurrenceIsValid = computed(() => !this.formValue().recurring || this.formValue().recurrenceInterval !== null);

  protected readonly canSubmit = computed(
    () => this.formStatus() === 'VALID' && this.sharesAreValid() && this.recurrenceIsValid() && !this.saving()
  );

  protected get sharesArray() {
    return this.form.controls.shares;
  }

  protected shareNameFor(participantId: number): string {
    return this.group()?.participants.find(p => p.id === participantId)?.name ?? '';
  }

  protected previewAmountFor(participantId: number): number {
    return this.previewShares().find(s => s.participantId === participantId)?.amount ?? 0;
  }

  constructor() {
    effect(() => {
      const groupId = Number(this.groupId());
      const expenseId = this.expenseId();
      if (!Number.isNaN(groupId)) {
        this.loadInitialData(groupId, expenseId ? Number(expenseId) : null);
      }
    }, { allowSignalWrites: true });
  }

  private loadInitialData(groupId: number, expenseId: number | null): void {
    this.loadingInitial.set(true);
    this.loadError.set(null);

    this.groupService.getGroup(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: group => {
          this.group.set(group);
          this.sharesArray.clear();
          for (const participant of group.participants) {
            this.sharesArray.push(createShareRow(this.fb, participant.id));
          }

          if (expenseId) {
            this.loadExpenseForEdit(groupId, expenseId);
          } else {
            this.form.patchValue({ paidById: group.myParticipantId, date: new Date(), currency: group.currency });
            this.loadingInitial.set(false);
          }
        },
        error: () => {
          this.loadError.set('Impossible de charger ce groupe.');
          this.loadingInitial.set(false);
        }
      });
  }

  private loadExpenseForEdit(groupId: number, expenseId: number): void {
    this.expenseService.get(groupId, expenseId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: expense => {
          this.form.patchValue({
            title: expense.title,
            // Show what was actually typed (and its currency), not the group-currency equivalent,
            // so re-editing a foreign-currency expense doesn't silently "snap" it to the group currency.
            amount: expense.originalAmount ?? expense.amount,
            currency: expense.originalCurrency ?? this.group()?.currency ?? null,
            date: new Date(`${expense.date}T00:00:00`),
            category: expense.category,
            paidById: expense.paidBy.id,
            splitType: expense.splitType,
            recurring: expense.recurring,
            recurrenceInterval: expense.recurrenceInterval
          });

          const includedIds = new Set(expense.shares.map(s => s.participantId));
          for (const row of this.sharesArray.controls) {
            const participantId = row.controls.participantId.value;
            const share = expense.shares.find(s => s.participantId === participantId);
            row.patchValue({
              included: includedIds.has(participantId),
              value: share?.value ?? null
            });
          }

          this.loadingInitial.set(false);
        },
        error: () => {
          this.loadError.set('Impossible de charger cette dépense.');
          this.loadingInitial.set(false);
        }
      });
  }

  protected async onReceiptSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // allow re-selecting the same file (e.g. after a bad scan)
    if (!file) {
      return;
    }

    this.scanning.set(true);
    try {
      const result = await this.ocrService.scanReceipt(file);

      if (result.amount !== null) {
        this.form.controls.amount.setValue(result.amount);
      }
      if (result.date !== null) {
        this.form.controls.date.setValue(new Date(`${result.date}T00:00:00`));
      }
      if (result.merchant !== null && !this.form.controls.title.value) {
        this.form.controls.title.setValue(result.merchant);
      }

      if (result.amount === null && result.date === null && result.merchant === null) {
        this.notification.error('Reçu illisible. Remplissez le formulaire manuellement.');
      } else {
        this.notification.success('Reçu analysé — vérifiez les informations avant de valider.');
      }
    } catch {
      this.notification.error('Erreur lors de la lecture du reçu.');
    } finally {
      this.scanning.set(false);
    }
  }

  protected submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }

    const groupId = Number(this.groupId());
    const value = this.formValue();
    const request = {
      title: value.title,
      amount: value.amount,
      date: toDateOnlyString(value.date),
      category: value.category,
      paidById: value.paidById!,
      splitType: value.splitType,
      shares: this.includedShareInputs().map(share => ({
        participantId: share.participantId,
        value: value.splitType === 'EQUAL' ? null : share.value
      })),
      recurring: value.recurring,
      recurrenceInterval: value.recurring ? value.recurrenceInterval : null,
      currency: value.currency
    };

    this.saving.set(true);
    const call$ = this.isEditMode()
      ? this.expenseService.update(groupId, Number(this.expenseId()), request)
      : this.expenseService.create(groupId, request);

    call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notification.success(this.isEditMode() ? 'Dépense modifiée.' : 'Dépense ajoutée.');
        this.checkBudgetAlerts(groupId, value.category);
        this.router.navigate(['/groups', groupId, 'expenses']);
      },
      error: () => this.saving.set(false)
    });
  }

  /** Fires a toast if this expense just pushed a matching budget (its category, or the
   * whole-group budget) over its limit — the user finds out immediately, not by stumbling
   * onto the Budget tab later. */
  private checkBudgetAlerts(groupId: number, category: Category): void {
    this.budgetService.list(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(budgets => {
        const exceeded = budgets.find(b => b.exceeded && (b.category === category || b.category === null));
        if (exceeded) {
          const label = exceeded.category ? this.categoryLabels[exceeded.category] : 'du groupe';
          this.notification.warning(`Budget ${label} dépassé !`);
        }
      });
  }
}

function toDateOnlyString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
