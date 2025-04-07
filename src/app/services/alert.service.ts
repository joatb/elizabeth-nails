import { Injectable } from "@angular/core";
import { ToastController } from '@ionic/angular/standalone';

@Injectable({
    providedIn: 'root',
})
export class AlertService {

    public toastButtons = [
        {
          text: 'Cerrar',
          role: 'cancel',
        },
    ];
    constructor(private toastCtrl: ToastController) { }

    async presentToast(message: string, duration: number = 2000) {
        const toast = await this.toastCtrl.create({
            message,
            duration,
            position: 'top',
            cssClass: 'custom-toast',
            buttons: this.toastButtons
        });
        return toast.present();
    }

    async presentErrorToast(message: string, duration: number = 2000) {
        const toast = await this.toastCtrl.create({
            message,
            duration,
            position: 'top',
            color: 'danger',
            buttons: this.toastButtons
        });
        return toast.present();
    }
}