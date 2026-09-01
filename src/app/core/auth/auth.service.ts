import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessTokenResponse, AuthSession, LoginRequest } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageKey = 'agrocontrol.auth';
  private readonly sessionState = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => {
    const session = this.sessionState();
    return !!session && new Date(session.expiresAt).getTime() > Date.now();
  });

  login(request: LoginRequest) {
    return this.http
      .post<AccessTokenResponse>(`${environment.apiUrl}/api/auth/login`, request)
      .pipe(
        tap((response) => {
          const session: AuthSession = { ...response, email: request.email };
          localStorage.setItem(this.storageKey, JSON.stringify(session));
          this.sessionState.set(session);
        })
      );
  }

  logout(): void {
    localStorage.removeItem(this.storageKey);
    this.sessionState.set(null);
    void this.router.navigate(['/login']);
  }

  token(): string | null {
    return this.isAuthenticated() ? this.sessionState()?.accessToken ?? null : null;
  }

  private readSession(): AuthSession | null {
    const serialized = localStorage.getItem(this.storageKey);
    if (!serialized) return null;

    try {
      const session = JSON.parse(serialized) as AuthSession;
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(this.storageKey);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(this.storageKey);
      return null;
    }
  }
}
