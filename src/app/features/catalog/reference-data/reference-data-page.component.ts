import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { getApiErrorMessage } from '../../../core/http/api-error.interceptor';
import { ReferenceDataItem, ReferenceDataKind, ReferenceDataService } from './reference-data.service';

interface ReferenceDataRouteConfig { kind: ReferenceDataKind; title: string; subtitle: string; }
interface ReferenceDataFormValue {
  name: string;
  description: string;
  registrationNumber: string;
  symbol: string;
  conversionFactor: number;
}

@Component({
  selector: 'app-reference-data-page',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatProgressSpinnerModule, MatTableModule],
  template: `
    <section class="page-header">
      <div><span class="eyebrow">Catálogo</span><h1>{{ config.title }}</h1><p>{{ config.subtitle }}</p></div>
      <button mat-flat-button color="primary" type="button" (click)="startCreate()"><mat-icon>add</mat-icon>Novo cadastro</button>
    </section>
    <mat-card appearance="outlined" class="filter-card">
      <mat-form-field appearance="outline"><mat-label>Pesquisar</mat-label><input matInput [value]="search()" (input)="search.set($any($event.target).value)" (keyup.enter)="load()" /><mat-icon matSuffix>search</mat-icon></mat-form-field>
      <button mat-stroked-button type="button" (click)="load()">Buscar</button>
    </mat-card>
    @if (editing()) {
      <mat-card appearance="outlined" class="form-card"><mat-card-header><mat-card-title>{{ selectedId() ? 'Editar' : 'Novo' }} {{ config.title.toLowerCase() }}</mat-card-title></mat-card-header><mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Nome</mat-label><input matInput formControlName="name" />@if (form.controls.name.touched && form.controls.name.invalid) { <mat-error>Informe um nome válido.</mat-error> }</mat-form-field>
          @if (config.kind === 'input-categories') { <mat-form-field appearance="outline"><mat-label>Descrição</mat-label><textarea matInput formControlName="description"></textarea></mat-form-field> }
          @if (config.kind === 'manufacturers') { <mat-form-field appearance="outline"><mat-label>Número de registro</mat-label><input matInput formControlName="registrationNumber" /></mat-form-field> }
          @if (config.kind === 'measurement-units') {
            <mat-form-field appearance="outline"><mat-label>Símbolo</mat-label><input matInput formControlName="symbol" /></mat-form-field>
            <mat-form-field appearance="outline"><mat-label>Fator de conversão</mat-label><input matInput type="number" step="0.000001" formControlName="conversionFactor" /></mat-form-field>
          }
          @if (errorMessage()) { <div class="error-message">{{ errorMessage() }}</div> }
          <div class="form-actions"><button mat-button type="button" (click)="cancelEdit()">Cancelar</button><button mat-flat-button color="primary" type="submit" [disabled]="saving()">@if (saving()) { <mat-spinner diameter="20" /> } @else { Salvar }</button></div>
        </form>
      </mat-card-content></mat-card>
    }
    <mat-card appearance="outlined">
      @if (loading()) { <div class="state"><mat-spinner diameter="36" /></div> }
      @else if (items().length === 0) { <div class="state"><mat-icon>inbox</mat-icon><p>Nenhum registro encontrado.</p></div> }
      @else {
        <table mat-table [dataSource]="items()">
          <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Nome</th><td mat-cell *matCellDef="let item">{{ item.name }}</td></ng-container>
          <ng-container matColumnDef="details"><th mat-header-cell *matHeaderCellDef>Detalhes</th><td mat-cell *matCellDef="let item">{{ details(item) }}</td></ng-container>
          <ng-container matColumnDef="status"><th mat-header-cell *matHeaderCellDef>Status</th><td mat-cell *matCellDef="let item"><span class="status" [class.inactive]="!item.isActive">{{ item.isActive ? 'Ativo' : 'Inativo' }}</span></td></ng-container>
          <ng-container matColumnDef="actions"><th mat-header-cell *matHeaderCellDef>Ações</th><td mat-cell *matCellDef="let item"><button mat-icon-button type="button" aria-label="Editar" (click)="startEdit(item)"><mat-icon>edit</mat-icon></button><button mat-icon-button type="button" (click)="toggleStatus(item)"><mat-icon>{{ item.isActive ? 'toggle_off' : 'toggle_on' }}</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
      }
    </mat-card>
  `,
  styles: [`.page-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;margin-bottom:20px}.page-header h1{margin:4px 0}.page-header p{margin:0;color:#65736a}.eyebrow{color:#2e7d32;font-weight:700;text-transform:uppercase;font-size:12px}.filter-card{display:flex;gap:12px;align-items:center;padding:16px;margin-bottom:16px}.filter-card mat-form-field{flex:1;margin-bottom:-20px}.form-card{margin-bottom:16px}form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px}.form-actions,.error-message{grid-column:1/-1}.form-actions{display:flex;justify-content:flex-end;gap:8px}.error-message{color:#b71c1c;background:#ffebee;padding:12px;border-radius:8px}table{width:100%}.state{min-height:220px;display:grid;place-items:center;align-content:center;color:#65736a}.status{padding:4px 10px;border-radius:999px;background:#e8f5e9;color:#1b5e20;font-size:12px;font-weight:700}.status.inactive{background:#eceff1;color:#455a64}@media(max-width:700px){.page-header,.filter-card{flex-direction:column}form{grid-template-columns:1fr}}`]
})
export class ReferenceDataPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(ReferenceDataService);
  readonly config = this.route.snapshot.data as ReferenceDataRouteConfig;
  readonly columns = ['name', 'details', 'status', 'actions'];
  readonly items = signal<ReferenceDataItem[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly search = signal('');
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group({ name: ['', [Validators.required, Validators.maxLength(150)]], description: ['', Validators.maxLength(500)], registrationNumber: ['', Validators.maxLength(50)], symbol: ['', Validators.maxLength(20)], conversionFactor: [1, Validators.min(0.000001)] });
  constructor() { this.load(); }
  load(): void { this.loading.set(true); this.service.list(this.config.kind, this.search()).subscribe({ next: (result) => { this.items.set(result.items); this.loading.set(false); }, error: (error) => { this.errorMessage.set(getApiErrorMessage(error)); this.loading.set(false); } }); }
  startCreate(): void { this.selectedId.set(null); this.form.reset({ name: '', description: '', registrationNumber: '', symbol: '', conversionFactor: 1 }); this.editing.set(true); this.errorMessage.set(''); }
  startEdit(item: ReferenceDataItem): void { this.selectedId.set(item.id); this.form.reset({ name: item.name, description: item.description ?? '', registrationNumber: item.registrationNumber ?? '', symbol: item.symbol ?? '', conversionFactor: item.conversionFactor ?? 1 }); this.editing.set(true); this.errorMessage.set(''); }
  cancelEdit(): void { this.editing.set(false); this.selectedId.set(null); }
  save(): void { if (this.form.invalid) { this.form.markAllAsTouched(); return; } this.saving.set(true); this.errorMessage.set(''); const payload = this.payload(this.form.getRawValue()); const request = this.selectedId() ? this.service.update(this.config.kind, this.selectedId()!, payload) : this.service.create(this.config.kind, payload); request.subscribe({ next: () => { this.saving.set(false); this.cancelEdit(); this.load(); }, error: (error) => { this.errorMessage.set(getApiErrorMessage(error)); this.saving.set(false); } }); }
  toggleStatus(item: ReferenceDataItem): void { this.service.changeStatus(this.config.kind, item.id, !item.isActive).subscribe({ next: () => this.load(), error: (error) => this.errorMessage.set(getApiErrorMessage(error)) }); }
  details(item: ReferenceDataItem): string { if (this.config.kind === 'input-categories') return item.description || 'Sem descrição'; if (this.config.kind === 'manufacturers') return item.registrationNumber || 'Sem registro'; return `${item.symbol ?? '-'} · fator ${item.conversionFactor ?? 1}`; }
  private payload(raw: ReferenceDataFormValue): Record<string, unknown> { if (this.config.kind === 'input-categories') return { name: raw.name, description: raw.description || null }; if (this.config.kind === 'manufacturers') return { name: raw.name, registrationNumber: raw.registrationNumber || null }; return { name: raw.name, symbol: raw.symbol, conversionFactor: raw.conversionFactor }; }
}
