import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import {
  AlertController,
  ActionSheetController,
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
import { ServicesProvider } from "../../../providers/services/services.provider";
import { Service } from "../../../providers/services/models/service";
import { EventService } from "../../../services/event.service";

type AppointmentWithServiceMeta = Appointment & {
  service_name?: string | null;
  service_color?: string | null;
};

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
  @Input() set events(value: Appointment[] | null) {
    this._events = Array.isArray(value) ? value : [];
    this.rebuildTimelineEvents();
  }
  loading = true;
  timelineEvents: DayEventItem[] = [];
  private _events: Appointment[] = [];
  private servicesById = new Map<string, Service>();
  private changed = false;

  private rebuildTimelineEvents(): void {
    this.timelineEvents = this._events
      .filter((event): event is Appointment => !!event)
      .map((event) => {
        const appointment = event as AppointmentWithServiceMeta;
        const serviceId = this.resolveServiceId(event);
        const service = serviceId ? this.servicesById.get(serviceId) : null;
        const serviceName = service?.name ?? appointment.service_name ?? null;
        const serviceColor = service?.color ?? appointment.service_color ?? null;
        const servicePrice =
          service?.price !== undefined && service?.price !== null
            ? Number(service.price)
            : null;
        const client = this.resolveClient(event);

        return {
          id: event.id,
          start_time: this.resolveDateValue(event.start_time),
          end_time: this.resolveDateValue(event.end_time),
          note: event.note,
          client,
          service_id: serviceId,
          service_name: serviceName,
          service_price: servicePrice,
          service_color: serviceColor,
        };
      });
  }

  constructor(
    private modalCtrl: ModalController,
    private appointmentsPvd: AppointmentsProvider,
    private servicesPvd: ServicesProvider,
    private eventService: EventService,
    private alertService: AlertService,
    private alertCtrl: AlertController,
    private actionSheetCtrl: ActionSheetController,
  ) {}

  ionViewWillLeave(): void {
    if (this.changed) {
      this.eventService.push("appointments.changed", {});
    }
  }

  async ngOnInit() {
    await this.loadServices();
    // Si events ya viene como input, no hace falta cargar de la API
    if (this._events.length > 0) {
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
    const appointmentsList = await this.appointmentsPvd.listAppointmentsInRange(
      this.date,
      this.date,
    );
    this.events = appointmentsList.documents ?? [];
    this.loading = false;
  }

  private async loadServices() {
    try {
      const servicesResult = await this.servicesPvd.listServices();
      this.servicesById = new Map(
        servicesResult.documents.map((service) => [service.id, service]),
      );
      this.rebuildTimelineEvents();
    } catch (error) {
      this.servicesById = new Map();
    }
  }

  async deleteEvent(event: DayEventItem) {
    if (!event.id) {
      return;
    }
    const appointmentId = event.id;
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
              this.changed = true;
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

  async editEvent(event: DayEventItem) {
    if (!event.id) return;

    const services = [...this.servicesById.values()];
    if (services.length === 0) {
      await this.alertService.presentToast("No hay servicios para asignar", 2500);
      return;
    }

    const actionSheet = await this.actionSheetCtrl.create({
      header: "Editar servicio de la cita",
      buttons: [
        {
          text: "Sin servicio",
          role: "destructive",
          handler: async () => {
            try {
              await this.appointmentsPvd.updateAppointment(event.id!, {
                service_id: null,
              });
              this.changed = true;
              await this.alertService.presentToast("Servicio eliminado de la cita", 2500);
              await this.loadEvents();
            } catch (error) {
              await this.alertService.presentErrorToast(
                "No se pudo quitar el servicio de la cita",
                2500,
              );
            }
          },
        },
        ...services.map((service) => ({
          text: `${service.name} - ${Number(service.price || 0).toFixed(2)}€`,
          handler: async () => {
            try {
              await this.appointmentsPvd.updateAppointment(event.id!, {
                service_id: service.id,
              });
              this.changed = true;
              await this.alertService.presentToast("Servicio de cita actualizado", 2500);
              await this.loadEvents();
            } catch (error) {
              await this.alertService.presentErrorToast(
                "No se pudo actualizar el servicio de la cita",
                2500,
              );
            }
          },
        })),
        { text: "Cancelar", role: "cancel" },
      ],
    });

    await actionSheet.present();
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
    client_id: string;
    service_id?: string;
  }) {
    await this.appointmentsPvd.createAppointment(appointment);
    this.changed = true;
    this.eventService.push("appointment.created", appointment);
    await this.alertService.presentToast("Cita creada", 2500);
    this.loadEvents();
  }

  private resolveClient(event: Appointment): {
    name: string;
    phone_country: string;
    phone: string;
  } {
    if (event.client && typeof event.client !== "string") {
      return {
        name: event.client.name ?? "Cliente eliminado",
        phone_country: event.client.phone_country ?? "",
        phone: event.client.phone ?? "",
      };
    }

    return {
      name: "Cliente eliminado",
      phone_country: "",
      phone: "",
    };
  }

  private resolveDateValue(value: string | Date | undefined): string | Date {
    if (!value) return new Date();
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : value;
  }

  private resolveServiceId(event: Appointment): string | null {
    const rawService = event.services;
    if (!rawService) return null;

    if (Array.isArray(rawService)) {
      const first = rawService[0];
      if (!first) return null;
      if (typeof first === "string") return first;
      return first.id ?? null;
    }

    if (typeof rawService === "string") return rawService;
    return rawService.id ?? null;
  }
}
