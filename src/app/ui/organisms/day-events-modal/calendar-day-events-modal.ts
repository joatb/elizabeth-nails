import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import {
  AlertController,
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
} from "@ionic/angular/standalone";
import { DayEventsTimelineComponent } from "../day-events-timeline/day-events-timeline.component";
import { DateTime } from "luxon";
import { AppointmentsProvider } from "../../../providers/appointments/appointments.provider";
import { Appointment } from "../../../providers/appointments/models/appointment";
import { AlertService } from "../../../services/alert.service";
import { CalendarAppointmentModalComponent } from "../appointment-modal/calendar-appointment-modal";
import { DayEventItem } from "../../molecules/mol-day-event-item/mol-day-event-item.component";

@Component({
  selector: "app-calendar-day-events-modal",
  templateUrl: "./calendar-day-events-modal.html",
  styleUrls: ["./calendary-day-events-modal.scss"],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
    DayEventsTimelineComponent,
  ],
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
    const appointmentsList = await this.appointmentsPvd.listAppointmentsInRange(
      this.date,
      this.date,
    );
    this.events = appointmentsList.documents;
    this.loading = false;
  }

  async deleteEvent(event: DayEventItem) {
    if (!event.$id) {
      return;
    }
    const appointmentId = event.$id;
    const confirmAlert = await this.alertCtrl.create({
      header: "Confirmar eliminación",
      message: "¿Estás seguro de que deseas eliminar esta cita?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "Eliminar",
          handler: async () => {
            try {
              await this.appointmentsPvd.deleteAppointment(appointmentId);
              await this.alertService.presentToast(
                "Cita eliminada correctamente",
                2500,
              );
              await this.loadEvents();
            } catch (error) {
              await this.alertService.presentToast(
                "Error al eliminar la cita",
                2500,
              );
            }
          },
        },
      ],
    });
    await confirmAlert.present();
  }

  async addEvent() {
    const modal = await this.modalCtrl.create({
      component: CalendarAppointmentModalComponent,
      componentProps: {
        day: this.date,
        startTime: DateTime.fromJSDate(this.date, { zone: "system" })
          .set({ hour: 9, minute: 0, second: 0, millisecond: 0 })
          .toISO(),
        endTime: DateTime.fromJSDate(this.date, { zone: "system" })
          .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
          .toISO(),
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
    await this.alertService.presentToast("Cita creada", 2500);
    this.loadEvents();
  }
}
