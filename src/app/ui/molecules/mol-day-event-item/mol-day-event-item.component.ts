import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { IonButton } from "@ionic/angular/standalone";
import { LucideAngularModule, ChevronDown, Pencil, Trash } from "lucide-angular";
import { AtomTimelineDotComponent } from "../../atoms/atom-timeline-dot/atom-timeline-dot.component";

type DayEventClient = {
  name: string;
  phone_country: string;
  phone: string;
};

export type DayEventItem = {
  id?: string;
  start_time: string | Date;
  end_time: string | Date;
  client: DayEventClient;
  note?: string | null;
  service_id?: string | null;
  service_name?: string | null;
  service_price?: number | null;
  service_color?: string | null;
  employee_name?: string | null;
  employee_color?: string | null;
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
  @Input() draggable: boolean = false;
  // En vistas sin un hilo de línea de tiempo (p.ej. columnas por empleado), el dot
  // flotante no tiene sentido; en su lugar se pinta una franja de color a la izquierda.
  @Input() showTimelineDot: boolean = true;
  // En vistas donde el cliente ya es fijo (p.ej. historial de un cliente concreto),
  // no hace falta repetir su nombre en cada tarjeta.
  @Input() showClientName: boolean = true;
  // En vistas que abarcan varios días (p.ej. historial de citas), hace falta mostrar
  // la fecha de cada cita, no solo la hora.
  @Input() showDate: boolean = false;
  // En vistas muy compactas (p.ej. columnas por empleado), la tarjeta puede no
  // tener alto suficiente para mostrar servicio/teléfono/nota. Con collapsible
  // activo, esas líneas solo se muestran cuando `expanded` es true; el padre
  // controla ese estado (p.ej. al hacer click en la tarjeta).
  @Input() collapsible: boolean = false;
  @Input() expanded: boolean = false;

  @Output() delete = new EventEmitter<DayEventItem>();
  @Output() edit = new EventEmitter<DayEventItem>();
  @Output() dragStart = new EventEmitter<DayEventItem>();

  get showDetails(): boolean {
    return !this.collapsible || this.expanded;
  }

  handleDragStart(nativeEvent: DragEvent): void {
    nativeEvent.dataTransfer?.setData("text/plain", this.event?.id ?? "");
    nativeEvent.dataTransfer!.effectAllowed = "move";
    this.dragStart.emit(this.event);
  }

  readonly Trash = Trash;
  readonly Pencil = Pencil;
  readonly ChevronDown = ChevronDown;

  get startTimeLabel(): string {
    return this.toTimeLabel(this.event?.start_time);
  }

  get endTimeLabel(): string {
    return this.toTimeLabel(this.event?.end_time);
  }

  get dateLabel(): string {
    const value = this.event?.start_time;
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
