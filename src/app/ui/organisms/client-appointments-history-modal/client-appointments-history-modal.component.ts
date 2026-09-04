import { Component, Input, OnInit } from "@angular/core";
import { InfiniteScrollCustomEvent, ModalController } from "@ionic/angular/standalone";
import { SharedModule } from "../../../modules/shared.module";
import { Appointment } from "../../../providers/appointments/models/appointment";
import { AppointmentsProvider } from "../../../providers/appointments/appointments.provider";
import { MolDayEventItemComponent, DayEventItem } from "../../molecules/mol-day-event-item/mol-day-event-item.component";

const PAGE_SIZE = 20;

@Component({
  selector: "app-client-appointments-history-modal",
  standalone: true,
  templateUrl: "./client-appointments-history-modal.component.html",
  styleUrls: ["./client-appointments-history-modal.component.scss"],
  imports: [SharedModule, MolDayEventItemComponent],
})
export class ClientAppointmentsHistoryModalComponent implements OnInit {
  @Input() clientName: string = "";
  @Input({ required: true }) clientId!: string;

  items: DayEventItem[] = [];
  isLoading = false;
  hasMore = true;
  private offset = 0;

  constructor(
    private modalCtrl: ModalController,
    private appointmentsProvider: AppointmentsProvider,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadPage();
  }

  get hasAppointments(): boolean {
    return this.items.length > 0;
  }

  async loadNextPage(event: InfiniteScrollCustomEvent): Promise<void> {
    await this.loadPage();
    await event.target.complete();
  }

  dismiss(): void {
    this.modalCtrl.dismiss();
  }

  private async loadPage(): Promise<void> {
    if (this.isLoading || !this.hasMore) return;
    this.isLoading = true;
    try {
      const result = await this.appointmentsProvider.listAppointmentsByClient(
        this.clientId,
        PAGE_SIZE,
        this.offset,
      );
      this.items.push(...result.documents.map((a) => this.toDayEventItem(a)));
      this.offset += result.documents.length;
      this.hasMore = result.hasMore;
    } finally {
      this.isLoading = false;
    }
  }

  private toDayEventItem(appointment: Appointment): DayEventItem {
    const service = appointment.services;
    return {
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      note: appointment.note,
      client: { name: this.clientName, phone_country: "", phone: "" },
      service_id: service?.id ?? null,
      service_name: service?.name ?? null,
      service_price: service ? Number(service.price) || 0 : null,
      service_color: service?.color ?? null,
      employee_name: appointment.employee?.name ?? null,
      employee_color: appointment.employee?.color ?? null,
    };
  }
}
