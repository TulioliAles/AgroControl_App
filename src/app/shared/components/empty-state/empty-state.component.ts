import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <strong>{{ title() }}</strong>
      @if (description()) { <span>{{ description() }}</span> }
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state { min-height:220px; display:grid; place-items:center; align-content:center; gap:.45rem; padding:24px; text-align:center; color:var(--ac-muted); }
    mat-icon { width:44px; height:44px; font-size:44px; color:#92a097; }
    strong { color:var(--ac-text); }
  `]
})
export class EmptyStateComponent {
  readonly icon = input('inbox');
  readonly title = input.required<string>();
  readonly description = input('');
}
