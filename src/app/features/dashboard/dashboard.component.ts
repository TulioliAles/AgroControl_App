import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getApiErrorMessage } from '../../core/http/api-error.interceptor';
import { DashboardData, DashboardService } from './dashboard.service';

interface DashboardMetric {
  label: string;
  value: number;
  helper: string;
  icon: string;
  format: 'integer' | 'decimal';
  attention?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Visão geral</p>
        <h1>Dashboard operacional</h1>
        <p>Acompanhe os principais indicadores de catálogo, saldo e validade.</p>
      </div>
      <button mat-stroked-button type="button" (click)="load()" [disabled]="loading()">
        <mat-icon>refresh</mat-icon>
        Atualizar
      </button>
    </section>

    @if (loading()) {
      <div class="page-state">
        <mat-spinner diameter="42" />
        <span>Consolidando os dados do AgroControl...</span>
      </div>
    } @else if (errorMessage()) {
      <mat-card appearance="outlined" class="error-card">
        <mat-icon>error</mat-icon>
        <div>
          <strong>Não foi possível carregar o dashboard.</strong>
          <span>{{ errorMessage() }}</span>
        </div>
        <button mat-button type="button" (click)="load()">Tentar novamente</button>
      </mat-card>
    } @else if (data(); as dashboard) {
      <section class="metric-grid">
        @for (metric of metrics(dashboard); track metric.label) {
          <mat-card
            appearance="outlined"
            class="metric-card"
            [class.attention]="metric.attention"
          >
            <div class="metric-icon"><mat-icon>{{ metric.icon }}</mat-icon></div>
            <div>
              <span>{{ metric.label }}</span>
              <strong>
                @if (metric.format === 'decimal') {
                  {{ metric.value | number:'1.0-6' }}
                } @else {
                  {{ metric.value | number:'1.0-0' }}
                }
              </strong>
              <small>{{ metric.helper }}</small>
            </div>
          </mat-card>
        }
      </section>

      <section class="quick-actions">
        <a mat-stroked-button routerLink="/insumos">
          <mat-icon>science</mat-icon>
          Gerenciar insumos
        </a>
        <a mat-stroked-button routerLink="/estoque">
          <mat-icon>inventory_2</mat-icon>
          Movimentar estoque
        </a>
        <a mat-stroked-button routerLink="/categorias">
          <mat-icon>category</mat-icon>
          Cadastros auxiliares
        </a>
      </section>

      <section class="content-grid">
        <mat-card appearance="outlined" class="panel-card">
          <mat-card-header>
            <div mat-card-avatar class="panel-avatar warning">
              <mat-icon>event_busy</mat-icon>
            </div>
            <mat-card-title>Alertas de validade</mat-card-title>
            <mat-card-subtitle>Lotes vencidos ou com vencimento em até 30 dias</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (!dashboard.expirationAlerts.length) {
              <div class="empty-state">
                <mat-icon>verified</mat-icon>
                <strong>Nenhum alerta de validade</strong>
                <span>Os lotes carregados estão dentro do prazo.</span>
              </div>
            } @else {
              <div class="alert-list">
                @for (alert of dashboard.expirationAlerts; track alert.lotId) {
                  <article class="alert-item" [class.expired]="alert.expired">
                    <div>
                      <strong>{{ alert.lotNumber }}</strong>
                      <span>{{ alert.agriculturalInputName }}</span>
                    </div>
                    <div class="alert-date">
                      <strong>{{ alert.expirationDate | date:'dd/MM/yyyy':'UTC' }}</strong>
                      <span>
                        @if (alert.expired) {
                          Vencido há {{ -alert.daysUntilExpiration }} dia(s)
                        } @else {
                          Vence em {{ alert.daysUntilExpiration }} dia(s)
                        }
                      </span>
                    </div>
                  </article>
                }
              </div>
            }
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/estoque">Ver estoque</a>
          </mat-card-actions>
        </mat-card>

        <mat-card appearance="outlined" class="panel-card">
          <mat-card-header>
            <div mat-card-avatar class="panel-avatar">
              <mat-icon>history</mat-icon>
            </div>
            <mat-card-title>Movimentações recentes</mat-card-title>
            <mat-card-subtitle>Últimas entradas e saídas localizadas</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (!dashboard.recentMovements.length) {
              <div class="empty-state">
                <mat-icon>swap_vert</mat-icon>
                <strong>Nenhuma movimentação encontrada</strong>
                <span>Registre uma entrada ou saída para iniciar o histórico.</span>
              </div>
            } @else {
              <div class="movement-list">
                @for (movement of dashboard.recentMovements; track movement.id) {
                  <article class="movement-item" [class.exit]="movement.type === 2">
                    <div class="movement-icon">
                      <mat-icon>{{ movement.type === 1 ? 'south_west' : 'north_east' }}</mat-icon>
                    </div>
                    <div class="movement-description">
                      <strong>{{ movement.agriculturalInputName }}</strong>
                      <span>Lote {{ movement.lotNumber }} · {{ movement.occurredAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                    <strong class="movement-value">
                      {{ movement.type === 1 ? '+' : '-' }}{{ movement.quantity | number:'1.0-6' }}
                    </strong>
                  </article>
                }
              </div>
            }
          </mat-card-content>
          <mat-card-actions align="end">
            <a mat-button routerLink="/estoque">Abrir movimentações</a>
          </mat-card-actions>
        </mat-card>
      </section>
    }
  `,
  styles: [`
    .page-heading { display:flex; justify-content:space-between; align-items:flex-end; gap:1rem; margin-bottom:1.5rem; }
    .page-heading h1 { margin:.15rem 0 .4rem; font-size:2rem; }
    .page-heading p { margin:0; color:#67716a; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; color:#1f6f43 !important; font-weight:700; }
    .page-state { min-height:420px; display:grid; place-items:center; align-content:center; gap:1rem; color:#67716a; }
    .error-card { display:flex; align-items:center; gap:1rem; padding:1rem 1.2rem; color:#9b2626; }
    .error-card div { display:grid; flex:1; }
    .metric-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:1rem; }
    .metric-card { padding:1.2rem; display:flex; align-items:center; gap:1rem; border-radius:18px; }
    .metric-card.attention { border-color:#efc27f; background:#fffaf2; }
    .metric-icon { width:48px; height:48px; display:grid; place-items:center; border-radius:14px; background:#e6f3ea; color:#1f6f43; flex:none; }
    .metric-card.attention .metric-icon { background:#fff0d7; color:#9a5700; }
    .metric-card div:last-child { display:grid; gap:.15rem; min-width:0; }
    .metric-card span,.metric-card small { color:#758078; }
    .metric-card strong { font-size:1.55rem; }
    .quick-actions { display:flex; flex-wrap:wrap; gap:.75rem; margin:1rem 0; }
    .content-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .panel-card { border-radius:18px; overflow:hidden; }
    .panel-avatar { display:grid; place-items:center; background:#e6f3ea; color:#1f6f43; border-radius:12px; }
    .panel-avatar.warning { background:#fff0d7; color:#9a5700; }
    mat-card-content { padding-top:1rem; }
    .empty-state { min-height:250px; display:grid; place-items:center; align-content:center; gap:.4rem; text-align:center; color:#748078; }
    .empty-state mat-icon { width:42px; height:42px; font-size:42px; color:#94a39a; }
    .alert-list,.movement-list { display:grid; gap:.65rem; }
    .alert-item,.movement-item { display:flex; align-items:center; gap:.8rem; padding:.85rem; border:1px solid #e6ebe7; border-radius:12px; }
    .alert-item > div:first-child,.movement-description { display:grid; flex:1; min-width:0; }
    .alert-item span,.movement-description span { color:#748078; font-size:.82rem; }
    .alert-date { display:grid; text-align:right; }
    .alert-date strong { color:#9a5700; }
    .alert-item.expired { border-color:#efb0b0; background:#fff8f8; }
    .alert-item.expired .alert-date strong { color:#b3261e; }
    .movement-icon { width:38px; height:38px; display:grid; place-items:center; border-radius:50%; background:#e8f5e9; color:#1b5e20; flex:none; }
    .movement-item.exit .movement-icon { background:#ffebee; color:#b71c1c; }
    .movement-value { color:#1b5e20; }
    .movement-item.exit .movement-value { color:#b71c1c; }
    @media (max-width:1100px) { .metric-grid { grid-template-columns:repeat(2,1fr); } .content-grid { grid-template-columns:1fr; } }
    @media (max-width:650px) { .page-heading { align-items:flex-start; flex-direction:column; } .metric-grid { grid-template-columns:1fr; } .alert-item { align-items:flex-start; } .alert-date { text-align:left; } }
  `]
})
export class DashboardComponent {
  private readonly dashboardService = inject(DashboardService);

  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly data = signal<DashboardData | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.dashboardService.load().subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  metrics(data: DashboardData): DashboardMetric[] {
    return [
      {
        label: 'Insumos ativos',
        value: data.activeInputs,
        helper: `${data.totalInputs} cadastrado(s)`,
        icon: 'science',
        format: 'integer'
      },
      {
        label: 'Lotes ativos',
        value: data.activeLots,
        helper: `${data.totalLots} lote(s) carregado(s)`,
        icon: 'inventory_2',
        format: 'integer'
      },
      {
        label: 'Saldo consolidado',
        value: data.totalStock,
        helper: 'Soma dos saldos dos lotes',
        icon: 'warehouse',
        format: 'decimal'
      },
      {
        label: 'Alertas de validade',
        value: data.expiredLots + data.expiringLots,
        helper: `${data.expiredLots} vencido(s)`,
        icon: 'event_busy',
        format: 'integer',
        attention: data.expiredLots + data.expiringLots > 0
      }
    ];
  }
}
