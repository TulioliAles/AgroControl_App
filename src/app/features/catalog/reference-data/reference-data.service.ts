import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

export type ReferenceDataKind = 'input-categories' | 'manufacturers' | 'measurement-units';

export interface ReferenceDataItem {
  id: string;
  name: string;
  description?: string | null;
  registrationNumber?: string | null;
  symbol?: string | null;
  conversionFactor?: number | null;
  isActive: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  list(kind: ReferenceDataKind, search = '') {
    let params = new HttpParams().set('page', 1).set('pageSize', 100);
    if (search.trim()) params = params.set('search', search.trim());
    return this.http.get<PagedResult<ReferenceDataItem>>(`${this.apiUrl}/api/${kind}`, { params });
  }

  create(kind: ReferenceDataKind, payload: Record<string, unknown>) {
    return this.http.post(`${this.apiUrl}/api/${kind}`, payload);
  }

  update(kind: ReferenceDataKind, id: string, payload: Record<string, unknown>) {
    return this.http.put(`${this.apiUrl}/api/${kind}/${id}`, payload);
  }

  changeStatus(kind: ReferenceDataKind, id: string, activate: boolean) {
    const action = activate ? 'activate' : 'deactivate';
    return this.http.patch(`${this.apiUrl}/api/${kind}/${id}/${action}`, {});
  }
}
