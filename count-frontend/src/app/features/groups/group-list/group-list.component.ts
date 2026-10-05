import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { GroupSummary } from '../../../core/models/group.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { MoneyDisplayComponent } from '../../../shared/components/money-display/money-display.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { GroupFormDialogComponent, GroupFormDialogResult } from '../group-form-dialog/group-form-dialog.component';

const ACCENT_GRADIENTS = [
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #ff5d8f, #ffb703)',
  'linear-gradient(135deg, #0d9488, #2dd4bf)',
  'linear-gradient(135deg, #3b82f6, #67e8f9)',
  'linear-gradient(135deg, #ffb703, #ff5d8f)'
];

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    MoneyDisplayComponent,
    AnimateInDirective
  ],
  templateUrl: './group-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupListComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly groups = signal<GroupSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGroups();
  }

  protected loadGroups(): void {
    this.loading.set(true);
    this.error.set(null);

    this.groupService.getMyGroups()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: groups => {
          this.groups.set(groups);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Impossible de charger vos groupes.');
          this.loading.set(false);
        }
      });
  }

  protected accentFor(name: string): string {
    let hash = 0;
    for (const char of name) {
      hash = char.charCodeAt(0) + ((hash << 5) - hash);
    }
    return ACCENT_GRADIENTS[Math.abs(hash) % ACCENT_GRADIENTS.length];
  }

  protected openGroup(groupId: number): void {
    this.router.navigate(['/groups', groupId]);
  }

  protected openCreateDialog(): void {
    const dialogRef = this.dialog.open<GroupFormDialogComponent, unknown, GroupFormDialogResult>(GroupFormDialogComponent, {
      width: '480px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.group) {
          this.notification.success('Groupe créé avec succès.');
          this.router.navigate(['/groups', result.group.id]);
        }
      });
  }
}
