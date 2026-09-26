import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const DURATION_MS = 3000;

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: DURATION_MS,
      verticalPosition: 'bottom',
      panelClass: 'se-snackbar-success'
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: DURATION_MS,
      verticalPosition: 'bottom',
      panelClass: 'se-snackbar-error'
    });
  }
}
