import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-statistic-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card appearance="outlined" class="card" [class.attention]="attention()">
      <div class="icon"><mat-icon>{{ icon() }}</mat-icon></div>
      <div class="content">
        <span>{{ label() }}</span>
        <strong>{{ value() }}</strong>
        @if (helper()) { <small>{{ helper() }}</small> }
      </div>
    </mat-card>
  `,
  styles: [`
    .card { padding:1.2rem; display:flex; align-items:center; gap:1rem; border-radius:var(--ac-radius); }
    .card.attention { border-color:#efc27f !important; background:#fffaf2; }
    .icon { width:48px; height:48px; display:grid; place-items:center; border-radius:14px; background:#e6f3ea; color:var(--ac-primary); }
    .attention .icon { background:#fff0d7; color:#9a5700; }
    .content { display:grid; gap:.15rem; min-width:0; }
    span,small { color:var(--ac-muted); }
    strong { font-size:1.55rem; }
  `]
})
export class StatisticCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly helper = input('');
  readonly icon = input('analytics');
  readonly attention = input(false);
}
