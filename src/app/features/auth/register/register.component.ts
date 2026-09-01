import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { getApiErrorMessage } from '../../../core/http/api-error.interceptor';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  template: `
    <main class="register-page">
      <mat-card appearance="outlined">
        <mat-card-header>
          <mat-card-title>Criar usuário administrador</mat-card-title>
          <mat-card-subtitle>Use esta tela para realizar o primeiro acesso ao AgroControl.</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline">
              <mat-label>Nome</mat-label>
              <input matInput formControlName="name" autocomplete="name" />
              @if (form.controls.name.touched && form.controls.name.invalid) {
                <mat-error>Informe o nome do usuário.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>E-mail</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              @if (form.controls.email.touched && form.controls.email.invalid) {
                <mat-error>Informe um e-mail válido.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Senha</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password" />
              @if (form.controls.password.touched && form.controls.password.invalid) {
                <mat-error>A senha deve conter pelo menos 8 caracteres.</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Confirmar senha</mat-label>
              <input matInput type="password" formControlName="confirmation" autocomplete="new-password" />
              @if (form.controls.confirmation.touched && form.hasError('passwordMismatch')) {
                <mat-error>As senhas não coincidem.</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <div class="message error"><mat-icon>error</mat-icon>{{ errorMessage() }}</div>
            }

            <button mat-flat-button color="primary" type="submit" [disabled]="submitting()">
              @if (submitting()) { <mat-spinner diameter="20" /> } @else { Criar usuário }
            </button>
            <a mat-button routerLink="/login">Voltar para o login</a>
          </form>
        </mat-card-content>
      </mat-card>
    </main>
  `,
  styles: [`
    .register-page { min-height: 100vh; display: grid; place-items: center; padding: 32px; background: #f2f6f2; }
    mat-card { width: min(100%, 520px); }
    form { display: grid; gap: 12px; margin-top: 24px; }
    .message { display: flex; gap: 8px; align-items: center; padding: 12px; border-radius: 8px; }
    .error { background: #ffebee; color: #b71c1c; }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(200)]],
      confirmation: ['', Validators.required]
    },
    {
      validators: (group) =>
        group.get('password')?.value === group.get('confirmation')?.value
          ? null
          : { passwordMismatch: true }
    }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.getRawValue();
    this.submitting.set(true);
    this.errorMessage.set('');
    this.auth.register({ name, email, password }).subscribe({
      next: () => void this.router.navigate(['/login'], { queryParams: { registered: true } }),
      error: (error) => {
        this.errorMessage.set(getApiErrorMessage(error));
        this.submitting.set(false);
      }
    });
  }
}
