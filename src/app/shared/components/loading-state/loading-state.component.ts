import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-state" role="status" aria-live="polite">
      <mat-spinner [diameter]="diameter()" />
      <span>{{ message() }}</span>
    </div>
  `,
  styles: [`
    .loading-state { min-height:220px; display:grid; place-items:center; align-content:center; gap:.8rem; color:var(--ac-muted); }
  `]
})
export class LoadingStateComponent {
  readonly message = input('Carregando...');
  readonly diameter = input(38);
}
