// filepath: /home/jtorrents/DEV/_personal/elizabeth-nails/elizabeth-nails-app/src/app/interceptors/global-error-handler.ts
import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '../../app/services/alert.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private alertService: AlertService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  handleError(error: any): void {
    // No mostrar errores si estamos en la página de login
    // El login maneja sus propios errores con un toast específico
    const currentUrl = this.router.url;
    if (currentUrl === '/login' || currentUrl.startsWith('/login')) {
      // Solo loguear el error en consola, no mostrar toast
      console.error('Error en login (no mostrado al usuario):', error);
      return;
    }

    let errorMessage = 'An unknown error occurred!';
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      // Network error
      errorMessage = 'No hay conexión con el servidor';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Use NgZone to ensure the toast is shown within Angular's zone
    this.ngZone.run(() => {
      this.showErrorToast(errorMessage);
    });

    // Log the error to the console (optional)
    console.error(error);
  }

  private async showErrorToast(message: string) {
    await this.alertService.presentErrorToast(message, 3000);
  }
}
