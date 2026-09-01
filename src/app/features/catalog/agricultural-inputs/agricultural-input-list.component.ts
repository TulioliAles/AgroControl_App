import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { getApiErrorMessage } from '../../../core/http/api-error.interceptor';
import { ReferenceDataItem } from '../reference-data/reference-data.service';
import {
  AgriculturalInput,
  AgriculturalInputPayload,
  AgriculturalInputService
} from './agricultural-input.service';

interface InputTypeOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-agricultural-input-list',
  standalone: true,
  imports: [
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
        <p class="eyebrow">Catálogo</p>
        <h1>Insumos agrícolas</h1>
        <p>Cadastre e mantenha os insumos utilizados no controle de estoque.</p>
      </div>
      <button mat-flat-button color="primary" type="button" (click)="startCreate()">
        <mat-icon>add</mat-icon>
        Novo insumo
      </button>
    </section>

    <mat-card appearance="outlined" class="filter-card">
      <mat-form-field appearance="outline">
        <mat-label>Pesquisar por nome</mat-label>
        <input
          matInput
          [value]="search()"
          (input)="search.set($any($event.target).value)"
          (keyup.enter)="applySearch()"
        />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Status</mat-label>
        <mat-select [value]="statusFilter()" (selectionChange)="changeStatusFilter($event.value)">
          <mat-option value="all">Todos</mat-option>
          <mat-option value="active">Ativos</mat-option>
          <mat-option value="inactive">Inativos</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button type="button" (click)="applySearch()">Buscar</button>
    </mat-card>

    @if (editing()) {
      <mat-card appearance="outlined" class="form-card">
        <mat-card-header>
          <mat-card-title>{{ selectedId() ? 'Editar insumo' : 'Novo insumo' }}</mat-card-title>
          <mat-card-subtitle>Preencha os dados e vincule os cadastros auxiliares ativos.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (referencesLoading()) {
            <div class="compact-state"><mat-spinner diameter="28" /> Carregando referências...</div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="save()">
              <mat-form-field appearance="outline">
                <mat-label>Nome</mat-label>
                <input matInput formControlName="name" />
                @if (form.controls.name.touched && form.controls.name.invalid) {
                  <mat-error>Informe um nome com até 150 caracteres.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Nome comercial</mat-label>
                <input matInput formControlName="commercialName" />
                @if (form.controls.commercialName.touched && form.controls.commercialName.invalid) {
                  <mat-error>Use no máximo 150 caracteres.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tipo</mat-label>
                <mat-select formControlName="type">
                  @for (type of inputTypes; track type.value) {
                    <mat-option [value]="type.value">{{ type.label }}</mat-option>
                  }
                </mat-select>
                @if (form.controls.type.touched && form.controls.type.invalid) {
                  <mat-error>Selecione o tipo.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Categoria</mat-label>
                <mat-select formControlName="categoryId">
                  @for (item of activeCategories(); track item.id) {
                    <mat-option [value]="item.id">{{ item.name }}</mat-option>
                  }
                </mat-select>
                @if (form.controls.categoryId.touched && form.controls.categoryId.invalid) {
                  <mat-error>Selecione a categoria.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Fabricante</mat-label>
                <mat-select formControlName="manufacturerId">
                  @for (item of activeManufacturers(); track item.id) {
                    <mat-option [value]="item.id">{{ item.name }}</mat-option>
                  }
                </mat-select>
                @if (form.controls.manufacturerId.touched && form.controls.manufacturerId.invalid) {
                  <mat-error>Selecione o fabricante.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Unidade de medida</mat-label>
                <mat-select formControlName="measurementUnitId">
                  @for (item of activeMeasurementUnits(); track item.id) {
                    <mat-option [value]="item.id">
                      {{ item.name }}{{ item.symbol ? ' (' + item.symbol + ')' : '' }}
                    </mat-option>
                  }
                </mat-select>
                @if (form.controls.measurementUnitId.touched && form.controls.measurementUnitId.invalid) {
                  <mat-error>Selecione a unidade de medida.</mat-error>
                }
              </mat-form-field>

              @if (formError()) {
                <div class="error-message">{{ formError() }}</div>
              }

              <div class="form-actions">
                <button mat-button type="button" (click)="cancelEdit()">Cancelar</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                  @if (saving()) { <mat-spinner diameter="20" /> } @else { Salvar }
                </button>
              </div>
            </form>
          }
        </mat-card-content>
      </mat-card>
    }

    <mat-card appearance="outlined" class="table-card">
      @if (loading()) {
        <div class="state"><mat-spinner diameter="36" /><span>Carregando insumos...</span></div>
      } @else if (listError()) {
        <div class="state error"><mat-icon>error</mat-icon><span>{{ listError() }}</span></div>
      } @else if (!items().length) {
        <div class="state"><mat-icon>inventory_2</mat-icon><span>Nenhum insumo encontrado.</span></div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="items()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Insumo</th>
              <td mat-cell *matCellDef="let item">
                <strong>{{ item.name }}</strong>
                <small>{{ item.commercialName || 'Sem nome comercial' }}</small>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let item">{{ inputTypeLabel(item.type) }}</td>
            </ng-container>

            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Categoria</th>
              <td mat-cell *matCellDef="let item">{{ referenceName(categories(), item.categoryId) }}</td>
            </ng-container>

            <ng-container matColumnDef="manufacturer">
              <th mat-header-cell *matHeaderCellDef>Fabricante</th>
              <td mat-cell *matCellDef="let item">{{ referenceName(manufacturers(), item.manufacturerId) }}</td>
            </ng-container>

            <ng-container matColumnDef="unit">
              <th mat-header-cell *matHeaderCellDef>Unidade</th>
              <td mat-cell *matCellDef="let item">{{ unitLabel(item.measurementUnitId) }}</td>
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
                <button mat-icon-button type="button" aria-label="Editar insumo" (click)="startEdit(item)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button
                  mat-icon-button
                  type="button"
                  [attr.aria-label]="item.isActive ? 'Desativar insumo' : 'Ativar insumo'"
                  (click)="toggleStatus(item)"
                >
                  <mat-icon>{{ item.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>

        <div class="pagination">
          <span>Página {{ page() }} de {{ totalPages() || 1 }} · {{ totalCount() }} registros</span>
          <div>
            <button mat-button type="button" [disabled]="page() <= 1" (click)="previousPage()">
              Anterior
            </button>
            <button mat-button type="button" [disabled]="page() >= totalPages()" (click)="nextPage()">
              Próxima
            </button>
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
    .form-card { margin-bottom:16px; }
    form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:20px; }
    .form-actions,.error-message { grid-column:1/-1; }
    .form-actions { display:flex; justify-content:flex-end; gap:8px; }
    .error-message { color:#b71c1c; background:#ffebee; padding:12px; border-radius:8px; }
    .compact-state { display:flex; gap:12px; align-items:center; padding:24px 0; color:#65736a; }
    .table-card { border-radius:18px; overflow:hidden; }
    .table-wrapper { overflow:auto; }
    table { width:100%; min-width:980px; }
    th { background:#f7f9f6; color:#657068; }
    td,th { padding:1rem 1.2rem; }
    td strong,td small { display:block; }
    td small { margin-top:4px; color:#758078; }
    .status { display:inline-flex; padding:.35rem .65rem; border-radius:999px; color:#176437; background:#e5f4e9; font-size:.78rem; font-weight:700; }
    .status.inactive { color:#7d3b18; background:#fbeadb; }
    .state { min-height:260px; display:grid; place-items:center; align-content:center; gap:.75rem; color:#6f7972; }
    .state.error { color:#9b2626; }
    .pagination { display:flex; justify-content:space-between; align-items:center; padding:12px 20px; border-top:1px solid #e4e9e5; color:#657068; }
    @media (max-width:800px) {
      .page-heading,.pagination { align-items:stretch; flex-direction:column; }
      .filter-card,form { grid-template-columns:1fr; }
      .filter-card mat-form-field { margin-bottom:0; }
    }
  `]
})
export class AgriculturalInputListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AgriculturalInputService);

  readonly columns = ['name', 'type', 'category', 'manufacturer', 'unit', 'status', 'actions'];
  readonly inputTypes: InputTypeOption[] = [
    { value: 1, label: 'Fertilizante' },
    { value: 2, label: 'Semente' },
    { value: 3, label: 'Defensivo' },
    { value: 4, label: 'Adjuvante' },
    { value: 5, label: 'Biológico' },
    { value: 6, label: 'Corretivo' },
    { value: 99, label: 'Outro' }
  ];

  readonly items = signal<AgriculturalInput[]>([]);
  readonly categories = signal<ReferenceDataItem[]>([]);
  readonly manufacturers = signal<ReferenceDataItem[]>([]);
  readonly measurementUnits = signal<ReferenceDataItem[]>([]);
  readonly loading = signal(true);
  readonly referencesLoading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly search = signal('');
  readonly statusFilter = signal<'all' | 'active' | 'inactive'>('all');
  readonly page = signal(1);
  readonly pageSize = 25;
  readonly totalCount = signal(0);
  readonly totalPages = signal(0);
  readonly listError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    commercialName: ['', Validators.maxLength(150)],
    type: [0, [Validators.required, Validators.min(1)]],
    categoryId: ['', Validators.required],
    manufacturerId: ['', Validators.required],
    measurementUnitId: ['', Validators.required]
  });

  readonly activeCategories = () => this.categories().filter((item) => item.isActive || item.id === this.form.controls.categoryId.value);
  readonly activeManufacturers = () => this.manufacturers().filter((item) => item.isActive || item.id === this.form.controls.manufacturerId.value);
  readonly activeMeasurementUnits = () => this.measurementUnits().filter((item) => item.isActive || item.id === this.form.controls.measurementUnitId.value);

  constructor() {
    this.loadReferences();
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.listError.set(null);
    const active = this.statusFilter() === 'all'
      ? undefined
      : this.statusFilter() === 'active';

    this.service.list(this.page(), this.pageSize, this.search(), active).subscribe({
      next: (result) => {
        this.items.set(result.items);
        this.totalCount.set(result.totalCount);
        this.totalPages.set(result.totalPages);
        this.loading.set(false);
      },
      error: (error) => {
        this.listError.set(getApiErrorMessage(error));
        this.loading.set(false);
      }
    });
  }

  applySearch(): void {
    this.page.set(1);
    this.load();
  }

  changeStatusFilter(value: 'all' | 'active' | 'inactive'): void {
    this.statusFilter.set(value);
    this.page.set(1);
    this.load();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  startCreate(): void {
    this.selectedId.set(null);
    this.form.reset({
      name: '',
      commercialName: '',
      type: 0,
      categoryId: '',
      manufacturerId: '',
      measurementUnitId: ''
    });
    this.formError.set(null);
    this.editing.set(true);
  }

  startEdit(item: AgriculturalInput): void {
    this.selectedId.set(item.id);
    this.form.reset({
      name: item.name,
      commercialName: item.commercialName ?? '',
      type: item.type,
      categoryId: item.categoryId,
      manufacturerId: item.manufacturerId,
      measurementUnitId: item.measurementUnitId
    });
    this.formError.set(null);
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.selectedId.set(null);
    this.formError.set(null);
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: AgriculturalInputPayload = {
      name: raw.name.trim(),
      commercialName: raw.commercialName.trim() || null,
      type: raw.type,
      categoryId: raw.categoryId,
      manufacturerId: raw.manufacturerId,
      measurementUnitId: raw.measurementUnitId
    };

    this.saving.set(true);
    this.formError.set(null);
    const request = this.selectedId()
      ? this.service.update(this.selectedId()!, payload)
      : this.service.create(payload);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: (error) => {
        this.formError.set(getApiErrorMessage(error));
        this.saving.set(false);
      }
    });
  }

  toggleStatus(item: AgriculturalInput): void {
    const action = item.isActive ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja realmente ${action} o insumo “${item.name}”?`)) {
      return;
    }

    this.service.changeStatus(item.id, !item.isActive).subscribe({
      next: () => this.load(),
      error: (error) => this.listError.set(getApiErrorMessage(error))
    });
  }

  inputTypeLabel(type: number): string {
    return this.inputTypes.find((item) => item.value === type)?.label ?? `Tipo ${type}`;
  }

  referenceName(items: ReferenceDataItem[], id: string): string {
    return items.find((item) => item.id === id)?.name ?? '—';
  }

  unitLabel(id: string): string {
    const unit = this.measurementUnits().find((item) => item.id === id);
    if (!unit) return '—';
    return unit.symbol ? `${unit.name} (${unit.symbol})` : unit.name;
  }

  private loadReferences(): void {
    this.referencesLoading.set(true);
    this.service.loadReferences().subscribe({
      next: (result) => {
        this.categories.set(result.categories.items);
        this.manufacturers.set(result.manufacturers.items);
        this.measurementUnits.set(result.measurementUnits.items);
        this.referencesLoading.set(false);
      },
      error: (error) => {
        this.formError.set(getApiErrorMessage(error));
        this.referencesLoading.set(false);
      }
    });
  }
}
