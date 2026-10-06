import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { OnboardingStatus } from '../../../core/models/onboarding.model';
import { GroupSummary } from '../../../core/models/group.model';

const DISMISSED_KEY = 'spliteasy_onboarding_dismissed';

interface ChecklistItem {
  label: string;
  icon: string;
  done: boolean;
  /** Null when there's no group yet to point the link at — the item is then just informational. */
  link: unknown[] | null;
  /** True only for the "create a group" item, which has no route of its own. */
  triggersCreateGroup: boolean;
}

@Component({
  selector: 'app-onboarding-checklist',
  standalone: true,
  imports: [RouterLink, MatIconModule, MatButtonModule],
  templateUrl: './onboarding-checklist.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnboardingChecklistComponent implements OnInit {
  private readonly onboardingService = inject(OnboardingService);
  private readonly destroyRef = inject(DestroyRef);

  /** Used to build links into "your first group" for the items that need one. */
  readonly groups = input<GroupSummary[]>([]);

  readonly createGroup = output<void>();

  private readonly status = signal<OnboardingStatus | null>(null);
  protected readonly dismissed = signal(this.readDismissed());

  protected readonly items = computed<ChecklistItem[]>(() => {
    const status = this.status();
    if (!status) {
      return [];
    }
    const firstGroupId = this.groups()[0]?.id ?? null;
    return [
      { label: 'Créer ou rejoindre un groupe', icon: 'group_add', done: status.hasGroup, link: null, triggersCreateGroup: true },
      {
        label: 'Ajouter votre première dépense',
        icon: 'receipt_long',
        done: status.hasExpense,
        link: firstGroupId ? ['/groups', firstGroupId, 'expenses', 'new'] : null,
        triggersCreateGroup: false
      },
      {
        label: 'Inviter un ami',
        icon: 'person_add',
        done: status.hasInvitedSomeone,
        link: firstGroupId ? ['/groups', firstGroupId] : null,
        triggersCreateGroup: false
      },
      {
        label: 'Définir un budget ou une cagnotte',
        icon: 'savings',
        done: status.hasBudgetOrGoal,
        link: firstGroupId ? ['/groups', firstGroupId, 'budget'] : null,
        triggersCreateGroup: false
      }
    ];
  });

  protected readonly doneCount = computed(() => this.items().filter(item => item.done).length);

  /** Hidden once every item is done, or once the user dismisses it manually. */
  protected readonly visible = computed(() => {
    const items = this.items();
    return items.length > 0 && !this.dismissed() && this.doneCount() < items.length;
  });

  ngOnInit(): void {
    this.onboardingService.getStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: status => this.status.set(status),
        // Purely a nice-to-have widget: if it fails to load, just stay hidden rather than
        // showing an error state for something this peripheral to the page's actual job.
        error: () => this.status.set(null)
      });
  }

  protected dismiss(): void {
    this.dismissed.set(true);
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // Private browsing / storage disabled: the card just reappears next visit, harmless.
    }
  }

  protected onItemClick(item: ChecklistItem): void {
    if (item.triggersCreateGroup && !item.done) {
      this.createGroup.emit();
    }
  }

  private readDismissed(): boolean {
    try {
      return localStorage.getItem(DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
