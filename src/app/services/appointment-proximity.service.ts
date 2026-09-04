import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular/standalone';
import { Appointment } from '../providers/appointments/models/appointment';

@Injectable({ providedIn: 'root' })
export class AppointmentProximityService {
  private readonly THRESHOLD_MS = 24 * 60 * 60 * 1000;
  private readonly MESSAGE = 'Quedan menos de 24h para esta cita. El cliente puede haber recibido ya un recordatorio con los datos anteriores. ¿Quieres continuar de todas formas?';

  isWithin24Hours(originalStartTime: string, now: Date = new Date()): boolean {
    return new Date(originalStartTime).getTime() - now.getTime() < this.THRESHOLD_MS;
  }

  hasRelevantChange(original: Appointment, changes: Partial<Appointment>): boolean {
    const startChanged =
      changes.start_time !== undefined && !this.sameInstant(changes.start_time, original.start_time);
    const endChanged =
      changes.end_time !== undefined && !this.sameInstant(changes.end_time, original.end_time);
    const clientChanged = changes.client_id !== undefined && changes.client_id !== original.client_id;
    return startChanged || endChanged || clientChanged;
  }

  private sameInstant(a: string | null | undefined, b: string | null | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return new Date(a).getTime() === new Date(b).getTime();
  }

  async confirmIfNeeded(alertCtrl: AlertController, original: Appointment, changes: Partial<Appointment>): Promise<boolean> {
    if (!this.hasRelevantChange(original, changes)) return true;
    if (!this.isWithin24Hours(original.start_time)) return true;

    return new Promise<boolean>(async (resolve) => {
      const alert = await alertCtrl.create({
        header: 'Aviso',
        message: this.MESSAGE,
        buttons: [
          { text: 'Cancelar', role: 'cancel', handler: () => resolve(false) },
          { text: 'Continuar', handler: () => resolve(true) },
        ],
      });
      await alert.present();
    });
  }

  buildDeleteWarningMessage(baseMessage: string, startTime: string): string {
    if (!this.isWithin24Hours(startTime)) return baseMessage;
    return `${baseMessage} ${this.MESSAGE}`;
  }
}
