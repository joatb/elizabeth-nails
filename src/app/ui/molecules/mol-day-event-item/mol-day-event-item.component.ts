import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton } from "@ionic/angular/standalone";
import { LucideAngularModule, Pencil, Trash } from "lucide-angular";
import { AtomTimelineDotComponent } from "../../atoms/atom-timeline-dot/atom-timeline-dot.component";

type DayEventClient = {
  name: string;
  phone_country: string;
  phone: string;
};

export type DayEventItem = {
  start_time: string | Date;
  end_time: string | Date;
  client: DayEventClient;
  note?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  service_price?: number | null;
  service_color?: string | null;
  $id?: string;
};

@Component({
  selector: "mol-day-event-item",
  standalone: true,
  templateUrl: "./mol-day-event-item.component.html",
  styleUrls: ["./mol-day-event-item.component.scss"],
  imports: [CommonModule, IonButton, LucideAngularModule, AtomTimelineDotComponent],
})
export class MolDayEventItemComponent {
  @Input({ required: true }) event!: DayEventItem;
  @Input() showDelete: boolean = true;
  @Input() showEdit: boolean = true;

  @Output() delete = new EventEmitter<DayEventItem>();
  @Output() edit = new EventEmitter<DayEventItem>();

  readonly Trash = Trash;
  readonly Pencil = Pencil;

  get startTimeLabel(): string {
    return this.toTimeLabel(this.event?.start_time);
  }

  get endTimeLabel(): string {
    return this.toTimeLabel(this.event?.end_time);
  }

  get hasPhone(): boolean {
    return Boolean(this.event?.client?.phone);
  }

  handleDelete(): void {
    this.delete.emit(this.event);
  }

  handleEdit(): void {
    this.edit.emit(this.event);
  }

  private toTimeLabel(value: string | Date | undefined): string {
    if (!value) return "--:--";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "--:--";
    return date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
}
