import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  ModalController
} from '@ionic/angular/standalone';
import { Day } from '../../../models/day';
import { SharedModule } from '../../../modules/shared.module';
import { EventService } from '../../../services/event.service';
import { CalendarAppointmentFormComponent } from "../calendar-appointment-form/calendar-appointment-form.component";

@Component({
  selector: 'app-calendar-appointment-modal',
  templateUrl: 'calendar-appointment-modal.html',
  imports: [FormsModule, SharedModule, CalendarAppointmentFormComponent],
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