import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface StockLot {
  id: string;
  agriculturalInputId: string;
  lotNumber: string;
  expirationDate: string | null;
  currentQuantity: number;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  stockLotId: string;
  type: 1 | 2;
  quantity: number;
  occurredAt: string;
  notes: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateStockLotPayload {
  agriculturalInputId: string;
  lotNumber: string;
  expirationDate: string | null;
}

export interface StockMovementPayload {
  quantity: number;
  occurredAt: string | null;
  notes: string | null;
}

@Injectable({ providedIn: 'root' })
export class StockLotService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/stock-lots`;

  list(page: number, pageSize: number, agriculturalInputId?: string, isActive?: boolean) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (agriculturalInputId) params = params.set('agriculturalInputId', agriculturalInputId);
    if (isActive !== undefined) params = params.set('isActive', isActive);
    return this.http.get<PagedResult<StockLot>>(this.baseUrl, { params });
  }

  create(payload: CreateStockLotPayload) {
    return this.http.post<{ id: string }>(this.baseUrl, payload);
  }

  registerEntry(id: string, payload: StockMovementPayload) {
    return this.http.post<void>(`${this.baseUrl}/${id}/entries`, payload);
  }

  registerExit(id: string, payload: StockMovementPayload) {
    return this.http.post<void>(`${this.baseUrl}/${id}/exits`, payload);
  }

  listMovements(id: string) {
    return this.http.get<StockMovement[]>(`${this.baseUrl}/${id}/movements`);
  }
}
