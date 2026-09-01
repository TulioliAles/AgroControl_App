import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-icon" [class.destructive]="data.destructive">
      <mat-icon>{{ data.destructive ? 'warning' : 'help' }}</mat-icon>
    </div>
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="dialogRef.close(false)">
        {{ data.cancelLabel || 'Cancelar' }}
      </button>
      <button mat-flat-button [color]="data.destructive ? 'warn' : 'primary'" type="button" (click)="dialogRef.close(true)">
        {{ data.confirmLabel || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display:block; padding-top:20px; min-width:min(440px,85vw); }
    .dialog-icon { width:54px; height:54px; margin:0 24px 4px; display:grid; place-items:center; border-radius:16px; background:#e8f5e9; color:#1b5e20; }
    .dialog-icon.destructive { background:#ffebee; color:#b71c1c; }
    mat-dialog-content { color:#5d6961; line-height:1.5; }
  `]
})
export class ConfirmDialogComponent {
  readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
