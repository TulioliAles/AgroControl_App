import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['app-snackbar', 'app-snackbar-success']
    });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 5500,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['app-snackbar', 'app-snackbar-error']
    });
  }
}
