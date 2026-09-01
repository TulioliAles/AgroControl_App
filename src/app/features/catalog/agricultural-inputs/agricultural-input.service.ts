import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PagedResult,
  ReferenceDataItem,
  ReferenceDataService
} from '../reference-data/reference-data.service';

export interface AgriculturalInput {
  id: string;
  name: string;
  commercialName: string | null;
  type: number;
  categoryId: string;
  manufacturerId: string;
  measurementUnitId: string;
  isActive: boolean;
}

export interface AgriculturalInputPayload {
  name: string;
  commercialName: string | null;
  type: number;
  categoryId: string;
  manufacturerId: string;
  measurementUnitId: string;
}

export interface AgriculturalInputReferences {
  categories: ReferenceDataItem[];
  manufacturers: ReferenceDataItem[];
  measurementUnits: ReferenceDataItem[];
}

@Injectable({ providedIn: 'root' })
export class AgriculturalInputService {
  private readonly http = inject(HttpClient);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly apiUrl = `${environment.apiUrl}/api/agricultural-inputs`;

  list(page = 1, pageSize = 25, search = '', isActive?: boolean) {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (isActive !== undefined) {
      params = params.set('isActive', isActive);
    }

    return this.http.get<PagedResult<AgriculturalInput>>(this.apiUrl, { params });
  }

  getById(id: string) {
    return this.http.get<AgriculturalInput>(`${this.apiUrl}/${id}`);
  }

  create(payload: AgriculturalInputPayload) {
    return this.http.post<{ id: string }>(this.apiUrl, payload);
  }

  update(id: string, payload: AgriculturalInputPayload) {
    return this.http.put<void>(`${this.apiUrl}/${id}`, payload);
  }

  changeStatus(id: string, activate: boolean) {
    const action = activate ? 'activate' : 'deactivate';
    return this.http.patch<void>(`${this.apiUrl}/${id}/${action}`, {});
  }

  loadReferences() {
    return forkJoin({
      categories: this.referenceData.list('input-categories'),
      manufacturers: this.referenceData.list('manufacturers'),
      measurementUnits: this.referenceData.list('measurement-units')
    });
  }
}
