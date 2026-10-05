import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { ParticipantService } from '../../../core/services/participant.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Participant } from '../../../core/models/participant.model';
import { ParticipantAvatarComponent } from '../../../shared/components/participant-avatar/participant-avatar.component';
import { AnimateInDirective } from '../../../shared/directives/animate-in.directive';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { GroupStore } from '../../groups/group-detail/group-store';
import {
  ParticipantFormDialogComponent,
  ParticipantFormDialogData,
  ParticipantFormDialogResult
} from '../participant-form-dialog/participant-form-dialog.component';

@Component({
  selector: 'app-participant-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatChipsModule, ParticipantAvatarComponent, AnimateInDirective],
  templateUrl: './participant-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParticipantListComponent {
  private readonly participantService = inject(ParticipantService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupStore = inject(GroupStore);

  protected isMe(participant: Participant): boolean {
    return participant.id === this.groupStore.myParticipantId();
  }

  protected openAddDialog(): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    this.openFormDialog({ mode: 'add', groupId: group.id });
  }

  protected openRenameDialog(participant: Participant): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    this.openFormDialog({ mode: 'rename', groupId: group.id, participant });
  }

  private openFormDialog(data: ParticipantFormDialogData): void {
    const dialogRef = this.dialog.open<ParticipantFormDialogComponent, ParticipantFormDialogData, ParticipantFormDialogResult>(
      ParticipantFormDialogComponent,
      { width: '420px', data }
    );

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result?.participant) {
          this.notification.success(data.mode === 'add' ? 'Participant ajouté.' : 'Participant renommé.');
          this.groupStore.reload();
        }
      });
  }

  protected deleteParticipant(participant: Participant): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer ce participant ?',
        message: `"${participant.name}" sera retiré du groupe.`,
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
        this.participantService.delete(group.id, participant.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.notification.success('Participant supprimé.');
              this.groupStore.reload();
            }
          });
      });
  }
}
