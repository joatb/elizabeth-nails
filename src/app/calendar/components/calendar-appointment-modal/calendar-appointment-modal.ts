import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { CalendarAppointmentFormComponent } from "../calendar-appointment-form/calendar-appointment-form.component";
import { EventService } from '../../../services/event.service';
import { Day } from '../../../models/day';

@Component({
  selector: 'app-calendar-appointment-modal',
  templateUrl: 'calendar-appointment-modal.html',
  imports: [FormsModule, IonButton, IonButtons, IonContent, IonHeader, IonItem, IonTitle, IonToolbar, CalendarAppointmentFormComponent],
})
export class CalendarAppointmentModalComponent {
  @Input() day!: Day;
  @Input() startTime!: string;
  @Input() endTime!: string;


  constructor(private modalCtrl: ModalController, private events: EventService) {}

  submit(){
    this.events.push('submit', true);
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  dismiss(data: any) {
    return this.modalCtrl.dismiss(data);
  }

}