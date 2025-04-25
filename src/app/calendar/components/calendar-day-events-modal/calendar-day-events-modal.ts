import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { AppointmentsProvider } from '../../../providers/appointments/appointments.provider';
import { CalendarAppointmentModalComponent } from '../calendar-appointment-modal/calendar-appointment-modal';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Appointment } from '../../../providers/appointments/models/appointment';
import { DateTime } from 'luxon';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-calendar-day-events-modal',
  templateUrl: 'calendar-day-events-modal.html',
  styleUrl: 'calendary-day-events-modal.scss',
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class CalendarDayEventsModalComponent {
  @Input() date!: Date;
  @Input() events: Appointment[] = [];
  loading = true;

  constructor(
    private modalCtrl: ModalController,
    private appointmentsPvd: AppointmentsProvider,
    private alertService: AlertService,
    private alertCtrl: AlertController,
  ) {}

  async ngOnInit() {
    // Si events ya viene como input, no hace falta cargar de la API
    if (this.events && this.events.length > 0) {
      this.loading = false;
    } else {
      this.loading = false;
      //await this.loadEvents();
    }
  }

  async loadEvents() {
    this.loading = true;
    // Suponiendo que appointmentsPvd tiene un método para filtrar por fecha
    // Buscar todas las citas del mes y filtrar por día
    const month = this.date.getMonth() + 1;
    const year = this.date.getFullYear();
    const appointmentsList = await this.appointmentsPvd.listAppointments(month, year);
    const dayStr = this.date.toISOString().substring(0, 10);
    this.events = appointmentsList.documents.filter(app => app.start_time.startsWith(dayStr));
    this.loading = false;
  }

  async deleteEvent(event: Appointment) {
    const confirmAlert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta cita?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.appointmentsPvd.deleteAppointment(event.$id);
              await this.alertService.presentToast('Cita eliminada correctamente', 2500);
              await this.loadEvents();
            } catch (error) {
              await this.alertService.presentToast('Error al eliminar la cita', 2500);
            }
          }
        }
      ]
    });
    await confirmAlert.present();
  }

  async addEvent() {
    const modal = await this.modalCtrl.create({
      component: CalendarAppointmentModalComponent,
      componentProps: { 
        day: this.date,
        startTime: DateTime.fromJSDate(this.date, { zone: 'system' }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 }).toISO(),
        endTime: DateTime.fromJSDate(this.date, { zone: 'system' }).set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO(),
      },
    });
    await modal.present();
    await modal.onDidDismiss().then(async (data) => {
      if (data.data) {
        await this.saveAppointment(data.data);
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  private async saveAppointment(appointment: {
    note: string;
    start_time: string;
    end_time: string;
    client: string;
  }) {
    await this.appointmentsPvd.createAppointment(appointment);
    await this.alertService.presentToast('Cita creada', 2500);
    this.loadEvents();
  }
}
