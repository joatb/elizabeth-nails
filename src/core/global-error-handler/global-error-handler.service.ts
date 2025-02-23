// filepath: /home/jtorrents/DEV/_personal/elizabeth-nails/elizabeth-nails-app/src/app/interceptors/global-error-handler.ts
import { ErrorHandler, Injectable, NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(private toastCtrl: ToastController, private ngZone: NgZone) {}

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
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    toast.present();
  }
}