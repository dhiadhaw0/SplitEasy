import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { GroupStore } from './group-store';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  providers: [GroupStore],
  templateUrl: './group-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupDetailComponent {
  protected readonly groupStore = inject(GroupStore);
  private readonly notification = inject(NotificationService);

  // Bound from the ':groupId' route param via withComponentInputBinding().
  readonly groupId = input.required<string>();

  protected readonly tabs = [
    { path: 'expenses', label: 'Dépenses', icon: 'receipt_long' },
    { path: 'balances', label: 'Équilibre', icon: 'balance' },
    { path: 'stats', label: 'Statistiques', icon: 'bar_chart' },
    { path: 'budget', label: 'Budget', icon: 'savings' },
    { path: 'activity', label: 'Activité', icon: 'history' },
    { path: 'participants', label: 'Participants', icon: 'group' },
    { path: 'settings', label: 'Paramètres', icon: 'settings' }
  ];

  protected readonly subtitle = computed(() => {
    const group = this.groupStore.group();
    if (!group) {
      return '';
    }
    const count = group.participants.length;
    return `${group.currency} · ${count} participant${count > 1 ? 's' : ''}`;
  });

  constructor() {
    effect(() => {
      const id = Number(this.groupId());
      if (!Number.isNaN(id)) {
        this.groupStore.load(id);
      }
    }, { allowSignalWrites: true });
  }

  protected shareInvite(): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    const link = `${window.location.origin}/join/${group.inviteCode}`;

    if (typeof navigator.share === 'function') {
      navigator.share({
        title: group.name,
        text: `Rejoins le groupe "${group.name}" sur SplitEasy`,
        url: link
      }).catch(() => { /* user cancelled the share sheet: nothing to do */ });
      return;
    }

    navigator.clipboard.writeText(link)
      .then(() => this.notification.success("Lien d'invitation copié dans le presse-papiers."))
      .catch(() => this.notification.error('Impossible de copier le lien.'));
  }
}
