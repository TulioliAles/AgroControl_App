import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../ui/notification.service';

export interface ApiProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const notification = inject(NotificationService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !request.url.includes('/api/auth/login')) {
        notification.error('Sua sessão expirou. Entre novamente.');
        auth.logout();
      } else if (error.status === 0) {
        notification.error('Não foi possível conectar à AgroControl API.');
      } else if (error.status >= 500) {
        notification.error(getApiErrorMessage(error));
      }

      return throwError(() => error);
    })
  );
};

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Não foi possível concluir a operação.';
  }

  const problem = error.error as ApiProblemDetails | undefined;
  const validationMessage = problem?.errors
    ? Object.values(problem.errors).flat().at(0)
    : undefined;

  return validationMessage ?? problem?.detail ?? problem?.title ?? 'Não foi possível concluir a operação.';
}
