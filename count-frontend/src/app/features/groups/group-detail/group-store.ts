import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GroupService } from '../../../core/services/group.service';
import { AuthService } from '../../../core/services/auth.service';
import { GroupDetail } from '../../../core/models/group.model';
import { Currency } from '../../../core/models/enums';

/**
 * Holds the currently viewed group so every tab (expenses, balances, stats, participants,
 * settings) shares one load and one set of signals instead of each re-fetching it.
 * Provided at the GroupDetailComponent level: a fresh instance per group, destroyed when leaving it.
 */
@Injectable()
export class GroupStore {
  private readonly groupService = inject(GroupService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _group = signal<GroupDetail | null>(null);
  private readonly _loading = signal(true);
  private readonly _error = signal<string | null>(null);

  readonly group = this._group.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly participants = computed(() => this._group()?.participants ?? []);
  readonly myParticipantId = computed(() => this._group()?.myParticipantId ?? null);
  readonly currency = computed<Currency>(() => this._group()?.currency ?? 'EUR');
  readonly isCreator = computed(() => {
    const group = this._group();
    const userId = this.authService.currentUser()?.id;
    return !!group && userId != null && group.createdById === userId;
  });

  load(groupId: number): void {
    this._loading.set(true);
    this._error.set(null);

    this.groupService.getGroup(groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: group => {
          this._group.set(group);
          this._loading.set(false);
        },
        error: () => {
          this._error.set('Impossible de charger ce groupe.');
          this._loading.set(false);
        }
      });
  }

  /** Updates the store in place with a response already returned by an API call, avoiding a refetch. */
  setGroup(group: GroupDetail): void {
    this._group.set(group);
  }

  reload(): void {
    const current = this._group();
    if (current) {
      this.load(current.id);
    }
  }
}
