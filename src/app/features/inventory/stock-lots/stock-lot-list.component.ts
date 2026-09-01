import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { getApiErrorMessage } from '../../../core/http/api-error.interceptor';
import {
  AgriculturalInput,
  AgriculturalInputService
} from '../../catalog/agricultural-inputs/agricultural-input.service';
import {
  StockLot,
  StockLotService,
  StockMovement,
  StockMovementPayload
} from './stock-lot.service';

type StatusFilter = 'all' | 'active' | 'inactive';
type MovementMode = 'entry' | 'exit';

@Component({
  selector: 'app-stock-lot-list',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule
  ],
  template: `
    <section class="page-heading">
      <div>
        <p class="eyebrow">Estoque</p>
        <h1>Lotes e movimentações</h1>
        <p>Controle saldos, entradas, saídas, validade e histórico dos insumos.</p>
      </div>
      <button mat-flat-button color="primary" type="button" (click)="startCreate()">
        <mat-icon>add</mat-icon>
        Novo lote
      </button>
    </section>

    <mat-card appearance="outlined" class="filter-card">
      <mat-form-field appearance="outline">
        <mat-label>Insumo</mat-label>
        <mat-select [value]="inputFilter()" (selectionChange)="changeInputFilter($event.value)">
          <mat-option value="">Todos os insumos</mat-option>
          @for (input of agriculturalInputs(); track input.id) {
            <mat-option [value]="input.id">{{ input.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [value]="statusFilter()" (selectionChange)="changeStatusFilter($event.value)">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Ativos</mat-option>
          <mat-option value="inactive">Inativos</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button type="button" (click)="loadLots()">
        <mat-icon>refresh</mat-icon>
        Atualizar
      </button>
    </mat-card>

    @if (creating()) {
      <mat-card appearance="outlined" class="form-card">
        <mat-card-header>
          <mat-card-title>Novo lote</mat-card-title>
          <mat-card-subtitle>O saldo inicial será zero; registre uma entrada após criar o lote.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="lotForm" (ngSubmit)="createLot()">
            <mat-form-field appearance="outline">
              <mat-label>Insumo agrícola</mat-label>
              <mat-select formControlName="agriculturalInputId">
                @for (input of activeAgriculturalInputs(); track input.id) {
                  <mat-option [value]="input.id">{{ input.name }}</mat-option>
                }
              </mat-select>
              @if (lotForm.controls.agriculturalInputId.touched && lotForm.controls.agriculturalInputId.invalid) {
                <mat-error>Selecione um insumo ativo.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Número do lote</mat-label>
              <input matInput formControlName="lotNumber" />
              @if (lotForm.controls.lotNumber.touched && lotForm.controls.lotNumber.invalid) {
                <mat-error>Informe o número do lote com até 100 caracteres.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data de validade</mat-label>
              <input matInput type="date" formControlName="expirationDate" />
            </mat-form-field>

            @if (formError()) {
              <div class="error-message">{{ formError() }}</div>
            }

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelCreate()">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                @if (saving()) { <mat-spinner diameter="20" /> } @else { Criar lote }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    @if (movementLot(); as lot) {
      <mat-card appearance="outlined" class="form-card movement-card">
        <mat-card-header>
          <mat-card-title>
            {{ movementMode() === 'entry' ? 'Registrar entrada' : 'Registrar saída' }}
          </mat-card-title>
          <mat-card-subtitle>
            Lote {{ lot.lotNumber }} · saldo atual {{ lot.currentQuantity | number:'1.0-6' }}
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="movementForm" (ngSubmit)="saveMovement()">
            <mat-form-field appearance="outline">
              <mat-label>Quantidade</mat-label>
              <input matInput type="number" min="0.000001" step="0.000001" formControlName="quantity" />
              @if (movementForm.controls.quantity.touched && movementForm.controls.quantity.invalid) {
                <mat-error>Informe uma quantidade maior que zero.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Data e hora</mat-label>
              <input matInput type="datetime-local" formControlName="occurredAt" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="notes-field">
              <mat-label>Observação</mat-label>
              <textarea matInput rows="3" formControlName="notes"></textarea>
              @if (movementForm.controls.notes.touched && movementForm.controls.notes.invalid) {
                <mat-error>Use no máximo 500 caracteres.</mat-error>
              }
            </mat-form-field>

            @if (movementError()) {
              <div class="error-message">{{ movementError() }}</div>
            }

            <div class="form-actions">
              <button mat-button type="button" (click)="cancelMovement()">Cancelar</button>
              <button
                mat-flat-button
                [color]="movementMode() === 'entry' ? 'primary' : 'warn'"
                type="submit"
                [disabled]="savingMovement()"
              >
                @if (savingMovement()) {
                  <mat-spinner diameter="20" />
                } @else {
                  Confirmar {{ movementMode() === 'entry' ? 'entrada' : 'saída' }}
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    @if (historyLot(); as lot) {
      <mat-card appearance="outlined" class="history-card">
        <mat-card-header>
          <mat-card-title>Histórico do lote {{ lot.lotNumber }}</mat-card-title>
          <mat-card-subtitle>{{ inputName(lot.agriculturalInputId) }}</mat-card-subtitle>
          <span class="header-spacer"></span>
          <button mat-icon-button type="button" aria-label="Fechar histórico" (click)="closeHistory()">
            <mat-icon>close</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          @if (historyLoading()) {
            <div class="compact-state"><mat-spinner diameter="30" /> Carregando movimentações...</div>
          } @else if (historyError()) {
            <div class="error-message">{{ historyError() }}</div>
          } @else if (!movements().length) {
            <div class="compact-state"><mat-icon>history</mat-icon> Nenhuma movimentação registrada.</div>
          } @else {
            <div class="movement-list">
              @for (movement of movements(); track movement.id) {
                <article class="movement-item" [class.exit]="movement.type === 2">
                  <div class="movement-icon">
                    <mat-icon>{{ movement.type === 1 ? 'south_west' : 'north_east' }}</mat-icon>
                  </div>
                  <div class="movement-content">
                    <strong>{{ movement.type === 1 ? 'Entrada' : 'Saída' }}</strong>
                    <span>{{ movement.occurredAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    @if (movement.notes) { <small>{{ movement.notes }}</small> }
                  </div>
                  <strong class="movement-quantity">
                    {{ movement.type === 1 ? '+' : '-' }}{{ movement.quantity | number:'1.0-6' }}
                  </strong>
                </article>
              }
            </div>
          }
        </mat-card-content>
      </mat-card>
    }

    <mat-card appearance="outlined" class="table-card">
      @if (loading()) {
        <div class="state"><mat-spinner diameter="36" /><span>Carregando lotes...</span></div>
      } @else if (listError()) {
        <div class="state error"><mat-icon>error</mat-icon><span>{{ listError() }}</span></div>
      } @else if (!items().length) {
        <div class="state"><mat-icon>inventory_2</mat-icon><span>Nenhum lote encontrado.</span></div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="items()">
            <ng-container matColumnDef="lotNumber">
              <th mat-header-cell *matHeaderCellDef>Lote</th>
              <td mat-cell *matCellDef="let item">
                <strong>{{ item.lotNumber }}</strong>
                <small>{{ inputName(item.agriculturalInputId) }}</small>
              </td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Saldo</th>
              <td mat-cell *matCellDef="let item">
                <strong class="quantity">{{ item.currentQuantity | number:'1.0-6' }}</strong>
              </td>
            </ng-container>

            <ng-container matColumnDef="expirationDate">
              <th mat-header-cell *matHeaderCellDef>Validade</th>
              <td mat-cell *matCellDef="let item">
                <span [class.expired]="isExpired(item.expirationDate)">
                  {{ item.expirationDate ? (item.expirationDate | date:'dd/MM/yyyy':'UTC') : 'Não informada' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let item">
                <span class="status" [class.inactive]="!item.isActive">
                  {{ item.isActive ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let item">
                <button mat-icon-button type="button" aria-label="Registrar entrada" [disabled]="!item.isActive" (click)="startMovement(item, 'entry')">
                  <mat-icon>add_circle</mat-icon>
                </button>
                <button mat-icon-button type="button" aria-label="Registrar saída" [disabled]="!item.isActive || item.currentQuantity <= 0" (click)="startMovement(item, 'exit')">
                  <mat-icon>remove_circle</mat-icon>
                </button>
                <button mat-icon-button type="button" aria-label="Ver histórico" (click)="openHistory(item)">
                  <mat-icon>history</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>

        <div class="pagination">
          <span>Página {{ page() }} de {{ totalPages() || 1 }} · {{ totalCount() }} lotes</span>
          <div>
            <button mat-button type="button" [disabled]="page() <= 1" (click)="previousPage()">Anterior</button>
            <button mat-button type="button" [disabled]="page() >= totalPages()" (click)="nextPage()">Próxima</button>
          </div>
        </div>
      }
    </mat-card>
  `,
  styles: [`
    .page-heading { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:1.5rem; gap:1rem; }
    h1 { margin:.15rem 0 .35rem; font-size:2rem; }
    p { margin:0; color:#67716a; }
    .eyebrow { text-transform:uppercase; letter-spacing:.12em; font-size:.72rem; color:#1f6f43; font-weight:700; }
    .filter-card { display:grid; grid-template-columns:minmax(260px,1fr) 220px auto; gap:12px; align-items:center; padding:16px; margin-bottom:16px; }
    .filter-card mat-form-field { margin-bottom:-20px; }
    .form-card,.history-card { margin-bottom:16px; }
    form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:20px; }
    .notes-field,.form-actions,.error-message { grid-column:1/-1; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; }
    .error-message { color:#b71c1c; background:#ffebee; padding:12px; border-radius:8px; }
    .compact-state { display:flex; min-height:90px; gap:12px; align-items:center; justify-content:center; color:#65736a; }
    .table-card { border-radius:18px; overflow:hidden; }
    .table-wrapper { overflow:auto; }
    table { width:100%; min-width:850px; }
    th { background:#f7f9f6; color:#657068; }
    td,th { padding:1rem 1.2rem; }
    td strong,td small { display:block; }
    td small { color:#748078; margin-top:4px; }
    .quantity { font-size:1.05rem; color:#1b5e20; }
    .status { display:inline-flex; padding:.35rem .65rem; border-radius:999px; color:#176437; background:#e5f4e9; font-size:.78rem; font-weight:700; }
    .status.inactive { color:#7d3b18; background:#fbeadb; }
    .expired { color:#b71c1c; font-weight:700; }
    .state { min-height:260px; display:grid; place-items:center; align-content:center; gap:.75rem; color:#6f7972; }
    .state.error { color:#9b2626; }
    .pagination { display:flex; justify-content:space-between; align-items:center; padding:12px 18px; border-top:1px solid #e5e9e5; color:#65736a; }
    mat-card-header { align-items:center; }
    .header-spacer { flex:1; }
    .movement-list { display:grid; gap:10px; margin-top:18px; }
    .movement-item { display:grid; grid-template-columns:auto 1fr auto; gap:14px; align-items:center; border:1px solid #dfe7df; border-radius:12px; padding:14px; }
    .movement-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:50%; background:#e8f5e9; color:#1b5e20; }
    .movement-item.exit .movement-icon { background:#ffebee; color:#b71c1c; }
    .movement-content { display:grid; gap:2px; }
    .movement-content span,.movement-content small { color:#65736a; }
    .movement-quantity { font-size:1.1rem; color:#1b5e20; }
    .movement-item.exit .movement-quantity { color:#b71c1c; }
    @media (max-width:800px) {
      .page-heading,.pagination { align-items:stretch; flex-direction:column; }
      .filter-card,form { grid-template-columns:1fr; }
      .filter-card mat-form-field { width:100%; }
    }
  `]
})
export class StockLotListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly stockLots = inject(StockLotService);
  private readonly inputsService = inject(AgriculturalInputService);
  private readonly pageSize = 20;

  readonly columns = ['lotNumber', 'quantity', 'expirationDate', 'status', 'actions'];
  readonly items = signal<StockLot[]>([]);
  readonly agriculturalInputs = signal<AgriculturalInput[]>([]);
  readonly loading = signal(true);
  readonly listError = signal('');
  readonly page = signal(1);
  readonly totalPages = signal(0);
  readonly totalCount = signal(0);
  readonly inputFilter = signal('');
  readonly statusFilter = signal<StatusFilter>('all');

  readonly creating = signal(false);
  readonly saving = signal(false);
  readonly formError = signal('');

  readonly movementLot = signal<StockLot | null>(null);
  readonly movementMode = signal<MovementMode>('entry');
  readonly savingMovement = signal(false);
  readonly movementError = signal('');

  readonly historyLot = signal<StockLot | null>(null);
  readonly movements = signal<StockMovement[]>([]);
  readonly historyLoading = signal(false);
  readonly historyError = signal('');

  readonly lotForm = this.fb.nonNullable.group({
    agriculturalInputId: ['', Validators.required],
    lotNumber: ['', [Validators.required, Validators.maxLength(100)]],
    expirationDate: ['']
  });

  readonly movementForm = this.fb.nonNullable.group({
    quantity: [0, [Validators.required, Validators.min(0.000001)]],
    occurredAt: [''],
    notes: ['', Validators.maxLength(500)]
  });

  constructor() {
    this.loadInitialData();
  }

  activeAgriculturalInputs(): AgriculturalInput[] {
    return this.agriculturalInputs().filter((item) => item.isActive);
  }

  loadInitialData(): void {
    this.loading.set(true);
    forkJoin({
      inputs: this.inputsService.list(1, 100, '', true),
      lots: this.stockLots.list(1, this.pageSize)
    }).subscribe({
      next: ({ inputs, lots }) => {
        this.agriculturalInputs.set(inputs.items);
        this.applyLotResult(lots);
      },
      error: (error) => {
        this.listError.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  loadLots(): void {
    this.loading.set(true);
    this.listError.set('');
    this.stockLots
      .list(this.page(), this.pageSize, this.inputFilter() || undefined, this.statusValue())
      .subscribe({
        next: (result) => this.applyLotResult(result),
        error: (error) => {
          this.listError.set(getApiErrorMessage(error));
          this.loading.set(false);
        }
      });
  }

  startCreate(): void {
    this.cancelMovement();
    this.closeHistory();
    this.lotForm.reset({ agriculturalInputId: '', lotNumber: '', expirationDate: '' });
    this.formError.set('');
    this.creating.set(true);
  }

  cancelCreate(): void {
    this.creating.set(false);
    this.formError.set('');
  }

  createLot(): void {
    if (this.lotForm.invalid || this.saving()) {
      this.lotForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.formError.set('');
    const raw = this.lotForm.getRawValue();
    this.stockLots.create({
      agriculturalInputId: raw.agriculturalInputId,
      lotNumber: raw.lotNumber.trim(),
      expirationDate: raw.expirationDate || null
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelCreate();
        this.page.set(1);
        this.loadLots();
      },
      error: (error) => {
        this.formError.set(getApiErrorMessage(error));
        this.saving.set(false);
      }
    });
  }

  startMovement(lot: StockLot, mode: MovementMode): void {
    this.cancelCreate();
    this.closeHistory();
    this.movementLot.set(lot);
    this.movementMode.set(mode);
    this.movementError.set('');
    this.movementForm.reset({ quantity: 0, occurredAt: this.localDateTime(), notes: '' });
  }

  cancelMovement(): void {
    this.movementLot.set(null);
    this.movementError.set('');
  }

  saveMovement(): void {
    const lot = this.movementLot();
    if (!lot || this.movementForm.invalid || this.savingMovement()) {
      this.movementForm.markAllAsTouched();
      return;
    }

    const raw = this.movementForm.getRawValue();
    if (this.movementMode() === 'exit' && raw.quantity > lot.currentQuantity) {
      this.movementError.set('A quantidade de saída não pode ser maior que o saldo disponível.');
      return;
    }

    const payload: StockMovementPayload = {
      quantity: raw.quantity,
      occurredAt: raw.occurredAt ? new Date(raw.occurredAt).toISOString() : null,
      notes: raw.notes.trim() || null
    };
    const request = this.movementMode() === 'entry'
      ? this.stockLots.registerEntry(lot.id, payload)
      : this.stockLots.registerExit(lot.id, payload);

    this.savingMovement.set(true);
    this.movementError.set('');
    request.subscribe({
      next: () => {
        this.savingMovement.set(false);
        this.cancelMovement();
        this.loadLots();
      },
      error: (error) => {
        this.movementError.set(getApiErrorMessage(error));
        this.savingMovement.set(false);
      }
    });
  }

  openHistory(lot: StockLot): void {
    this.cancelCreate();
    this.cancelMovement();
    this.historyLot.set(lot);
    this.movements.set([]);
    this.historyError.set('');
    this.historyLoading.set(true);
    this.stockLots.listMovements(lot.id).subscribe({
      next: (items) => {
        this.movements.set(items);
        this.historyLoading.set(false);
      },
      error: (error) => {
        this.historyError.set(getApiErrorMessage(error));
        this.historyLoading.set(false);
      }
    });
  }

  closeHistory(): void {
    this.historyLot.set(null);
    this.movements.set([]);
    this.historyError.set('');
  }

  changeInputFilter(value: string): void {
    this.inputFilter.set(value);
    this.page.set(1);
    this.loadLots();
  }

  changeStatusFilter(value: StatusFilter): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.loadLots();
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((value) => value - 1);
      this.loadLots();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((value) => value + 1);
      this.loadLots();
    }
  }

  inputName(id: string): string {
    return this.agriculturalInputs().find((item) => item.id === id)?.name ?? 'Insumo não localizado';
  }

  isExpired(expirationDate: string | null): boolean {
    if (!expirationDate) return false;
    const expiration = new Date(`${expirationDate}T23:59:59`);
    return expiration.getTime() < Date.now();
  }

  private statusValue(): boolean | undefined {
    if (this.statusFilter() === 'active') return true;
    if (this.statusFilter() === 'inactive') return false;
    return undefined;
  }

  private applyLotResult(result: { items: StockLot[]; page: number; totalPages: number; totalCount: number }): void {
    this.items.set(result.items);
    this.page.set(result.page);
    this.totalPages.set(result.totalPages);
    this.totalCount.set(result.totalCount);
    this.loading.set(false);
  }

  private localDateTime(): string {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
  }
}
