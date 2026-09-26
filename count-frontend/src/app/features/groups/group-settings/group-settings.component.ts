import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { GroupService } from '../../../core/services/group.service';
import { NotificationService } from '../../../core/services/notification.service';
import { CURRENCIES, Currency } from '../../../core/models/enums';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { GroupStore } from '../group-detail/group-store';

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './group-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GroupSettingsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly notification = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly groupStore = inject(GroupStore);

  protected readonly currencies = CURRENCIES;
  protected readonly saving = signal(false);
  protected readonly regenerating = signal(false);
  protected readonly deleting = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(255)]],
    currency: ['EUR' as Currency, [Validators.required]]
  });

  constructor() {
    effect(() => {
      const group = this.groupStore.group();
      if (group) {
        this.form.patchValue({
          name: group.name,
          description: group.description ?? '',
          currency: group.currency
        });
      }
    });
  }

  protected saveChanges(): void {
    const group = this.groupStore.group();
    if (!group || this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.groupService.update(group.id, this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.groupStore.setGroup(updated);
          this.saving.set(false);
          this.notification.success('Groupe mis à jour.');
        },
        error: () => this.saving.set(false)
      });
  }

  protected regenerateInviteCode(): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: "Régénérer le code d'invitation ?",
        message: "L'ancien lien d'invitation cessera de fonctionner immédiatement.",
        confirmLabel: 'Régénérer'
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result?.confirmed) {
          return;
        }
        this.regenerating.set(true);
        this.groupService.regenerateInviteCode(group.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: updated => {
              this.groupStore.setGroup(updated);
              this.regenerating.set(false);
              this.notification.success("Code d'invitation régénéré.");
            },
            error: () => this.regenerating.set(false)
          });
      });
  }

  protected copyInviteCode(): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }
    navigator.clipboard.writeText(`${window.location.origin}/join/${group.inviteCode}`)
      .then(() => this.notification.success('Lien copié dans le presse-papiers.'));
  }

  protected deleteGroup(): void {
    const group = this.groupStore.group();
    if (!group) {
      return;
    }

    const dialogRef = this.dialog.open<ConfirmDialogComponent, unknown, ConfirmDialogResult>(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Supprimer ce groupe ?',
        message: `Cette action est irréversible : toutes les dépenses de "${group.name}" seront perdues. Tapez le nom du groupe pour confirmer.`,
        confirmLabel: 'Supprimer',
        color: 'warn',
        requireTypedText: group.name
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result?.confirmed) {
          return;
        }
        this.deleting.set(true);
        this.groupService.delete(group.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.notification.success('Groupe supprimé.');
              this.router.navigateByUrl('/groups');
            },
            error: () => this.deleting.set(false)
          });
      });
  }
}
