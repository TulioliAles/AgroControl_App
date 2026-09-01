import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import {
  AgriculturalInput,
  AgriculturalInputService
} from '../catalog/agricultural-inputs/agricultural-input.service';
import {
  StockLot,
  StockLotService,
  StockMovement
} from '../inventory/stock-lots/stock-lot.service';

export interface DashboardMovement extends StockMovement {
  lotNumber: string;
  agriculturalInputName: string;
}

export interface ExpirationAlert {
  lotId: string;
  lotNumber: string;
  agriculturalInputName: string;
  expirationDate: string;
  daysUntilExpiration: number;
  expired: boolean;
}

export interface DashboardData {
  totalInputs: number;
  activeInputs: number;
  totalLots: number;
  activeLots: number;
  totalStock: number;
  expiredLots: number;
  expiringLots: number;
  recentMovements: DashboardMovement[];
  expirationAlerts: ExpirationAlert[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly inputService = inject(AgriculturalInputService);
  private readonly stockLotService = inject(StockLotService);

  load() {
    return forkJoin({
      inputs: this.inputService.list(1, 100),
      lots: this.stockLotService.list(1, 100)
    }).pipe(
      switchMap(({ inputs, lots }) => {
        const selectedLots = lots.items.slice(0, 12);
        const movementRequests = selectedLots.map((lot) =>
          this.stockLotService.listMovements(lot.id).pipe(
            catchError(() => of([] as StockMovement[])),
            map((movements) => ({ lot, movements }))
          )
        );

        if (!movementRequests.length) {
          return of(this.buildData(inputs.items, lots.items, []));
        }

        return forkJoin(movementRequests).pipe(
          map((movementGroups) =>
            this.buildData(inputs.items, lots.items, movementGroups)
          )
        );
      })
    );
  }

  private buildData(
    inputs: AgriculturalInput[],
    lots: StockLot[],
    movementGroups: Array<{ lot: StockLot; movements: StockMovement[] }>
  ): DashboardData {
    const inputNames = new Map(inputs.map((input) => [input.id, input.name]));
    const today = this.startOfDay(new Date());

    const expirationAlerts = lots
      .filter((lot): lot is StockLot & { expirationDate: string } => !!lot.expirationDate)
      .map((lot) => {
        const expiration = this.parseDateOnly(lot.expirationDate);
        const daysUntilExpiration = Math.ceil(
          (expiration.getTime() - today.getTime()) / 86_400_000
        );

        return {
          lotId: lot.id,
          lotNumber: lot.lotNumber,
          agriculturalInputName: inputNames.get(lot.agriculturalInputId) ?? 'Insumo não localizado',
          expirationDate: lot.expirationDate,
          daysUntilExpiration,
          expired: expiration < today
        };
      })
      .filter((alert) => alert.expired || alert.daysUntilExpiration <= 30)
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration)
      .slice(0, 8);

    const recentMovements = movementGroups
      .flatMap(({ lot, movements }) =>
        movements.map((movement) => ({
          ...movement,
          lotNumber: lot.lotNumber,
          agriculturalInputName:
            inputNames.get(lot.agriculturalInputId) ?? 'Insumo não localizado'
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
      )
      .slice(0, 8);

    return {
      totalInputs: inputs.length,
      activeInputs: inputs.filter((input) => input.isActive).length,
      totalLots: lots.length,
      activeLots: lots.filter((lot) => lot.isActive).length,
      totalStock: lots.reduce((total, lot) => total + lot.currentQuantity, 0),
      expiredLots: expirationAlerts.filter((alert) => alert.expired).length,
      expiringLots: expirationAlerts.filter((alert) => !alert.expired).length,
      recentMovements,
      expirationAlerts
    };
  }

  private parseDateOnly(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private startOfDay(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
}
