import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../core/ui/loading.service';

@Component({
  selector: 'app-global-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    @if (loading.isLoading()) {
      <div class="overlay" role="status" aria-live="polite" aria-label="Carregando">
        <mat-spinner diameter="44" />
      </div>
    }
  `,
  styles: [`
    .overlay { position:fixed; inset:0; z-index:2000; display:grid; place-items:center; background:rgba(255,255,255,.58); backdrop-filter:blur(2px); }
  `]
})
export class GlobalLoadingComponent {
  readonly loading = inject(LoadingService);
}
