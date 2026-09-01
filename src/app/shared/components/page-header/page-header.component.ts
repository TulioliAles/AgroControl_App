import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="page-header">
      <div>
        @if (eyebrow()) { <span class="eyebrow">{{ eyebrow() }}</span> }
        <h1>{{ title() }}</h1>
        @if (subtitle()) { <p>{{ subtitle() }}</p> }
      </div>
      <div class="actions"><ng-content /></div>
    </section>
  `,
  styles: [`
    .page-header { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; margin-bottom:1.5rem; }
    h1 { margin:.15rem 0 .35rem; font-size:clamp(1.55rem,3vw,2rem); }
    p { margin:0; color:var(--ac-muted); }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; color:var(--ac-primary); font-weight:700; }
    .actions { display:flex; gap:.75rem; flex-wrap:wrap; }
    @media (max-width:640px) { .page-header { align-items:stretch; flex-direction:column; } .actions { width:100%; } }
  `]
})
export class PageHeaderComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly subtitle = input('');
}
