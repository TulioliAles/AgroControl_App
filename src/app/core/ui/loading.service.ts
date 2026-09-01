import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pendingRequests = signal(0);
  readonly isLoading = () => this.pendingRequests() > 0;

  begin(): void {
    this.pendingRequests.update((value) => value + 1);
  }

  end(): void {
    this.pendingRequests.update((value) => Math.max(0, value - 1));
  }
}
