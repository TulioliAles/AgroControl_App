import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../../environments/environment';

interface StockLot {
  id: string;
  agriculturalInputId: string;
  lotNumber: string;
  expirationDate: string | null;
  currentQuantity: number;
  isActive: boolean;
}

interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Component({
  selector: 'app-stock-lot-list',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatTableModule],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Estoque</p>
        <h1>Lotes</h1>
        <p>Acompanhe saldos e validades dos lotes cadastrados.</p>
      </div>
      <button mat-flat-button color="primary" type="button">
        <mat-icon>add</mat-icon>
        Novo lote
      </button>
    </section>

    <mat-card appearance="outlined" class="table-card">
      @if (loading()) {
        <div class="state"><mat-spinner diameter="36" /><span>Carregando lotes...</span></div>
      } @else if (error()) {
        <div class="state error"><mat-icon>error</mat-icon><span>{{ error() }}</span></div>
      } @else {
        <table mat-table [dataSource]="items()">
          <ng-container matColumnDef="lotNumber">
            <th mat-header-cell *matHeaderCellDef>Lote</th>
            <td mat-cell *matCellDef="let item"><strong>{{ item.lotNumber }}</strong></td>
          </ng-container>
          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Saldo</th>
            <td mat-cell *matCellDef="let item">{{ item.currentQuantity }}</td>
          </ng-container>
          <ng-container matColumnDef="expirationDate">
            <th mat-header-cell *matHeaderCellDef>Validade</th>
            <td mat-cell *matCellDef="let item">{{ item.expirationDate || 'Não informada' }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let item">
              <span class="status" [class.inactive]="!item.isActive">{{ item.isActive ? 'Ativo' : 'Inativo' }}</span>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        @if (!items().length) {
          <div class="state"><mat-icon>inventory_2</mat-icon><span>Nenhum lote cadastrado.</span></div>
        }
      }
    </mat-card>
  `,
  styles: [`
    .page-heading { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1.5rem; gap:1rem; }
    h1 { margin:.15rem 0 .35rem; font-size:2rem; } p { margin:0; color:#67716a; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; color:#1f6f43; font-weight:700; }
    .table-card { border-radius:18px; overflow:hidden; } table { width:100%; }
    th { background:#f7f9f6; color:#657068; } td, th { padding:1rem 1.2rem; }
    .status { display:inline-flex; padding:.35rem .65rem; border-radius:999px; color:#176437; background:#e5f4e9; font-size:.78rem; font-weight:700; }
    .status.inactive { color:#7d3b18; background:#fbeadb; }
    .state { min-height:260px; display:grid; place-items:center; align-content:center; gap:.75rem; color:#6f7972; }
    .state.error { color:#9b2626; }
  `]
})
export class StockLotListComponent {
  private readonly http = inject(HttpClient);
  readonly columns = ['lotNumber', 'quantity', 'expirationDate', 'status'];
  readonly items = signal<StockLot[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    const params = new HttpParams().set('page', 1).set('pageSize', 25);
    this.http.get<PagedResult<StockLot>>(`${environment.apiUrl}/api/stock-lots`, { params }).subscribe({
      next: (result) => { this.items.set(result.items); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível carregar os lotes.'); this.loading.set(false); }
    });
  }
}
