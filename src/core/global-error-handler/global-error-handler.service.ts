// filepath: /home/jtorrents/DEV/_personal/elizabeth-nails/elizabeth-nails-app/src/app/interceptors/global-error-handler.ts
import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { AlertService } from '../../app/services/alert.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private alertService: AlertService, private ngZone: NgZone) {}

  handleError(error: any): void {
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