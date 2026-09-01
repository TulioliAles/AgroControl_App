import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Visão geral</p>
        <h1>Dashboard</h1>
        <p>Acompanhe os principais indicadores operacionais do AgroControl.</p>
      </div>
    </section>

    <section class="metric-grid">
      @for (metric of metrics; track metric.label) {
        <mat-card appearance="outlined" class="metric-card">
          <div class="metric-icon"><mat-icon>{{ metric.icon }}</mat-icon></div>
          <div>
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <small>{{ metric.helper }}</small>
          </div>
        </mat-card>
      }
    </section>

    <section class="content-grid">
      <mat-card appearance="outlined" class="panel-card">
        <mat-card-header>
          <mat-card-title>Primeiros passos</mat-card-title>
          <mat-card-subtitle>Fluxo recomendado de configuração</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <ol class="steps">
            <li>Cadastrar categorias, fabricantes e unidades de medida.</li>
            <li>Cadastrar os insumos agrícolas.</li>
            <li>Criar os lotes de estoque.</li>
            <li>Registrar entradas e saídas.</li>
          </ol>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined" class="panel-card highlight-card">
        <mat-card-header>
          <mat-card-title>Integração ativa</mat-card-title>
          <mat-card-subtitle>Frontend preparado para consumir a AgroControl API</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p>O interceptor JWT já envia o token Bearer automaticamente nas requisições protegidas.</p>
        </mat-card-content>
      </mat-card>
    </section>
  `,
  styles: [`
    .page-heading { display: flex; justify-content: space-between; margin-bottom: 1.75rem; }
    .page-heading h1 { margin: 0.15rem 0 0.4rem; font-size: 2rem; }
    .page-heading p { margin: 0; color: #67716a; }
    .eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; color: #1f6f43 !important; font-weight: 700; }
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
    .metric-card { padding: 1.2rem; display: flex; align-items: center; gap: 1rem; border-radius: 18px; }
    .metric-icon { width: 48px; height: 48px; display: grid; place-items: center; border-radius: 14px; background: #e6f3ea; color: #1f6f43; }
    .metric-card div:last-child { display: grid; gap: .15rem; }
    .metric-card span, .metric-card small { color: #758078; }
    .metric-card strong { font-size: 1.55rem; }
    .content-grid { display: grid; grid-template-columns: 1.3fr .7fr; gap: 1rem; margin-top: 1rem; }
    .panel-card { border-radius: 18px; padding: .5rem; }
    .highlight-card { background: linear-gradient(145deg, #f0f7f2, #ffffff); }
    .steps { margin: 1rem 0 0; padding-left: 1.2rem; display: grid; gap: .8rem; }
    @media (max-width: 1000px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } .content-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent {
  readonly metrics = [
    { label: 'Insumos', value: '—', helper: 'Cadastros ativos', icon: 'science' },
    { label: 'Lotes', value: '—', helper: 'Lotes em estoque', icon: 'inventory_2' },
    { label: 'Entradas', value: '—', helper: 'Movimentações recentes', icon: 'south_west' },
    { label: 'Saídas', value: '—', helper: 'Movimentações recentes', icon: 'north_east' }
  ];
}
