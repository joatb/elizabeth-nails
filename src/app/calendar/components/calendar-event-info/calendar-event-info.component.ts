import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SharedModule } from '../../../modules/shared.module';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-calendar-event-info',
  templateUrl: 'calendar-event-info.component.html',
  styleUrls: ['calendar-event-info.component.scss'],
  imports: [SharedModule]
})
export class CalendarEventInfoComponent {
  @Input() event: any;

  constructor(private modalCtrl: ModalController) {}

  getFormattedDate(date: Date) {
    try {
      // Usar la fecha ya convertida de extendedProps
      const dateTime = DateTime.fromJSDate(date, { zone: 'system' });
      if (dateTime.isValid) {
        return dateTime.toFormat('HH:mm');
      }
      return 'Fecha inválida';
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  dismiss() {
    return this.modalCtrl.dismiss();
  }

  deleteAppointment() {
    return this.modalCtrl.dismiss('delete');
  }
} 