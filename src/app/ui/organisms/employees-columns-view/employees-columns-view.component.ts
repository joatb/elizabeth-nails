import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MolDayEventItemComponent, DayEventItem } from "../../molecules/mol-day-event-item/mol-day-event-item.component";
import { MolAddEventButtonComponent } from "../../molecules/mol-add-event-button/mol-add-event-button.component";
import { Appointment } from "../../../providers/appointments/models/appointment";
import { Employee } from "../../../providers/employees/models/employee";

const UNASSIGNED_KEY = "__unassigned__";
// Franja horaria por defecto del negocio si no hay citas que la amplíen.
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 20;
// Duración mínima "visual" de una cita muy corta, para que su altura en % no
// desaparezca del todo (se complementa con un min-height en CSS).
const MIN_EVENT_MINUTES = 15;

// Cita ya posicionada dentro de la columna de su empleado: top/height en %
// respecto al rango de horas visible, calculados a partir de start/end_time
// reales (no solo la hora en punto en la que empieza). left/width reparten el
// ancho de la columna en sub-columnas cuando varias citas se solapan en el
// tiempo (p.ej. "Sin asignar", donde no hay un empleado que las separe).
type PositionedDayEvent = DayEventItem & {
  topPercent: number;
  heightPercent: number;
  leftPercent: number;
  widthPercent: number;
};

// Intervalo auxiliar usado solo para calcular el layout de solapamiento.
type EventInterval = {
  event: DayEventItem;
  topPercent: number;
  heightPercent: number;
  startMinutes: number;
  endMinutes: number;
};

type EmployeeColumn = {
  key: string;
  name: string;
  color: string | null;
  employeeId: string | null;
  events: PositionedDayEvent[];
  hasEvents: boolean;
};

@Component({
  selector: "org-employees-columns-view",
  standalone: true,
  templateUrl: "./employees-columns-view.component.html",
  styleUrls: ["./employees-columns-view.component.scss"],
  imports: [CommonModule, MolDayEventItemComponent, MolAddEventButtonComponent],
})
export class EmployeesColumnsViewComponent {
  @Input() date!: Date;

  // Rango de horas configurado en Horarios para el día mostrado. Si no llega
  // (sin horario configurado ese día), se usa la franja por defecto.
  @Input() set businessHourRange(value: { startHour: number; endHour: number } | null) {
    this._businessHourRange = value;
    this.rebuildColumns();
  }

  @Input() set employees(value: Employee[] | null) {
    this._employees = Array.isArray(value) ? value : [];
    this.rebuildColumns();
  }
  get employees(): Employee[] {
    return this._employees;
  }

  @Input() set appointments(value: Appointment[] | null) {
    this._appointments = Array.isArray(value) ? value : [];
    this.rebuildColumns();
  }

  @Output() addEvent = new EventEmitter<{ employeeId: string | null }>();
  @Output() editEvent = new EventEmitter<DayEventItem>();
  @Output() deleteEvent = new EventEmitter<DayEventItem>();
  @Output() reassignEmployee = new EventEmitter<{ appointmentId: string; employeeId: string | null }>();

  columns: EmployeeColumn[] = [];
  timeSlots: string[] = [];
  dragOverColumnKey: string | null = null;
  // Cita actualmente expandida (mol-day-event-item en modo collapsible solo
  // muestra hora + nombre hasta que se hace click para ver el resto).
  expandedEventId: string | null = null;
  private _appointments: Appointment[] = [];
  private _employees: Employee[] = [];
  private draggedAppointmentId: string | null = null;
  private _businessHourRange: { startHour: number; endHour: number } | null = null;
  // Rango de minutos que cubre `timeSlots`, recalculado en buildHourSlots();
  // toda cita se posiciona en % respecto a este rango.
  private rangeStartMinutes = DEFAULT_START_HOUR * 60;
  private rangeTotalMinutes = (DEFAULT_END_HOUR - DEFAULT_START_HOUR + 1) * 60;

  toggleExpanded(eventId: string | undefined): void {
    if (!eventId) return;
    this.expandedEventId = this.expandedEventId === eventId ? null : eventId;
  }

  handleDragStart(event: DayEventItem): void {
    this.draggedAppointmentId = event.id ?? null;
  }

  handleDragOver(nativeEvent: DragEvent, columnKey: string): void {
    if (!this.draggedAppointmentId) return;
    nativeEvent.preventDefault();
    this.dragOverColumnKey = columnKey;
  }

  handleDragLeave(columnKey: string): void {
    if (this.dragOverColumnKey === columnKey) {
      this.dragOverColumnKey = null;
    }
  }

  handleDrop(nativeEvent: DragEvent, employeeId: string | null): void {
    nativeEvent.preventDefault();
    this.dragOverColumnKey = null;
    const appointmentId =
      this.draggedAppointmentId || nativeEvent.dataTransfer?.getData("text/plain") || null;
    this.draggedAppointmentId = null;
    if (!appointmentId) return;

    const appointment = this._appointments.find((a) => a.id === appointmentId);
    if (!appointment || (appointment.employee_id ?? null) === employeeId) return;

    this.reassignEmployee.emit({ appointmentId, employeeId });
  }

  private rebuildColumns(): void {
    const activeEmployees = (this.employees ?? []).filter((e) => e.active);
    const grouped = new Map<string, Appointment[]>();

    for (const employee of activeEmployees) {
      grouped.set(employee.id, []);
    }
    grouped.set(UNASSIGNED_KEY, []);

    for (const appointment of this._appointments) {
      const key = appointment.employee_id ?? UNASSIGNED_KEY;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(appointment);
    }

    // Franjas horarias (una por hora) que cubren todo el día, compartidas por todas
    // las columnas, para que se vean como filas transversales alineadas entre empleados.
    this.timeSlots = this.buildHourSlots();

    const columns: EmployeeColumn[] = activeEmployees.map((employee) => {
      const employeeAppointments = grouped.get(employee.id) ?? [];
      return {
        key: employee.id,
        name: employee.name,
        color: employee.color,
        employeeId: employee.id,
        events: this.layoutEvents(employeeAppointments),
        hasEvents: employeeAppointments.length > 0,
      };
    });

    const unassignedAppointments = grouped.get(UNASSIGNED_KEY) ?? [];
    columns.push({
      key: UNASSIGNED_KEY,
      name: "Sin asignar",
      color: null,
      employeeId: null,
      events: this.layoutEvents(unassignedAppointments),
      hasEvents: unassignedAppointments.length > 0,
    });

    this.columns = columns;
  }

  private buildHourSlots(): string[] {
    let startHour = this._businessHourRange?.startHour ?? DEFAULT_START_HOUR;
    let endHour = this._businessHourRange?.endHour ?? DEFAULT_END_HOUR;

    for (const appointment of this._appointments) {
      const start = new Date(appointment.start_time);
      const end = new Date(appointment.end_time);
      if (!Number.isNaN(start.getTime())) {
        startHour = Math.min(startHour, start.getHours());
      }
      if (!Number.isNaN(end.getTime())) {
        const endHourValue = end.getMinutes() > 0 ? end.getHours() : end.getHours() - 1;
        endHour = Math.max(endHour, endHourValue);
      }
    }

    this.rangeStartMinutes = startHour * 60;
    this.rangeTotalMinutes = (endHour - startHour + 1) * 60;

    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }

  // Posiciona cada cita en % respecto al rango de horas visible, en vez de
  // repartirla en un cubo fijo por hora en punto (lo que hacía que una cita
  // de 9:30 a 11:00 pareciera ocupar solo la franja de las 9:00). Las citas
  // que se solapan en el tiempo dentro de la misma columna (p.ej. "Sin
  // asignar") se reparten en sub-columnas en vez de dibujarse unas encima de
  // otras.
  private layoutEvents(appointments: Appointment[]): PositionedDayEvent[] {
    const rangeEndMinutes = this.rangeStartMinutes + this.rangeTotalMinutes;
    const intervals: EventInterval[] = [];

    for (const appointment of appointments) {
      const start = new Date(appointment.start_time);
      const end = new Date(appointment.end_time);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) continue;

      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = Math.max(
        end.getHours() * 60 + end.getMinutes(),
        startMinutes + MIN_EVENT_MINUTES,
      );

      // Fuera del rango de horas visible: no se dibuja.
      if (endMinutes <= this.rangeStartMinutes || startMinutes >= rangeEndMinutes) continue;

      const clampedStart = Math.max(startMinutes, this.rangeStartMinutes);
      const clampedEnd = Math.min(endMinutes, rangeEndMinutes);

      intervals.push({
        event: this.toTimelineEvent(appointment),
        topPercent: ((clampedStart - this.rangeStartMinutes) / this.rangeTotalMinutes) * 100,
        heightPercent: ((clampedEnd - clampedStart) / this.rangeTotalMinutes) * 100,
        startMinutes: clampedStart,
        endMinutes: clampedEnd,
      });
    }

    return this.assignOverlapColumns(intervals);
  }

  // Reparte los intervalos solapados en sub-columnas dentro de la misma
  // columna de empleado (algoritmo clásico "clusters + greedy columns", el
  // mismo tipo de layout que usa Google Calendar en su vista de día):
  // 1) agrupa en "clusters" los eventos conectados por solapamiento (en
  //    cuanto hay un hueco real entre citas, empieza un cluster nuevo, así
  //    dos citas del mediodía no comparten ancho con dos de la tarde aunque
  //    ambas parejas se solapen entre sí);
  // 2) dentro de cada cluster, asigna cada evento a la primera sub-columna
  //    cuyo último evento ya haya terminado; si ninguna sirve, abre una
  //    sub-columna nueva. El ancho final de cada evento es 100 / nº de
  //    sub-columnas del cluster al que pertenece.
  private assignOverlapColumns(intervals: EventInterval[]): PositionedDayEvent[] {
    const sorted = [...intervals].sort(
      (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes,
    );

    const result: PositionedDayEvent[] = [];
    let cluster: EventInterval[] = [];
    let clusterEndMinutes = -Infinity;

    const flushCluster = () => {
      if (cluster.length === 0) return;

      // Fin del último evento colocado en cada sub-columna, para decidir en
      // cuál encaja el siguiente evento sin solaparse.
      const columnEndMinutes: number[] = [];
      const columnByEvent = new Map<EventInterval, number>();

      for (const interval of cluster) {
        let column = columnEndMinutes.findIndex((end) => end <= interval.startMinutes);
        if (column === -1) {
          column = columnEndMinutes.length;
          columnEndMinutes.push(interval.endMinutes);
        } else {
          columnEndMinutes[column] = interval.endMinutes;
        }
        columnByEvent.set(interval, column);
      }

      const columnCount = columnEndMinutes.length;
      for (const interval of cluster) {
        const column = columnByEvent.get(interval) ?? 0;
        result.push({
          ...interval.event,
          topPercent: interval.topPercent,
          heightPercent: interval.heightPercent,
          leftPercent: (column / columnCount) * 100,
          widthPercent: 100 / columnCount,
        });
      }

      cluster = [];
      clusterEndMinutes = -Infinity;
    };

    for (const interval of sorted) {
      if (cluster.length > 0 && interval.startMinutes >= clusterEndMinutes) {
        flushCluster();
      }
      cluster.push(interval);
      clusterEndMinutes = Math.max(clusterEndMinutes, interval.endMinutes);
    }
    flushCluster();

    return result;
  }

  private toTimelineEvent(appointment: Appointment): DayEventItem {
    const service = appointment.services;
    const client = appointment.client;
    return {
      id: appointment.id,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      note: appointment.note,
      employee_name: appointment.employee?.name ?? null,
      employee_color: appointment.employee?.color ?? null,
      client: {
        name: client && typeof client !== "string" ? client.name ?? "Cliente eliminado" : "Cliente eliminado",
        phone_country: client && typeof client !== "string" ? client.phone_country ?? "" : "",
        phone: client && typeof client !== "string" ? client.phone ?? "" : "",
      },
      service_id: service && typeof service !== "string" ? service.id ?? null : null,
      service_name: service && typeof service !== "string" ? service.name ?? null : null,
      service_price: service && typeof service !== "string" ? Number(service.price) || 0 : null,
      service_color: service && typeof service !== "string" ? service.color ?? null : null,
    };
  }

  handleAdd(employeeId: string | null): void {
    this.addEvent.emit({ employeeId });
  }

  handleEdit(event: DayEventItem): void {
    this.editEvent.emit(event);
  }

  handleDelete(event: DayEventItem): void {
    this.deleteEvent.emit(event);
  }
}
