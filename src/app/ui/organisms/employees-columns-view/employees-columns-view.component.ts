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

type EmployeeColumn = {
  key: string;
  name: string;
  color: string | null;
  employeeId: string | null;
  // Una fila por cada franja horaria del día (compartidas entre todas las columnas),
  // para que las citas de la misma hora se alineen visualmente entre empleados.
  rows: DayEventItem[][];
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
  private _appointments: Appointment[] = [];
  private _employees: Employee[] = [];
  private draggedAppointmentId: string | null = null;
  private _businessHourRange: { startHour: number; endHour: number } | null = null;

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
        rows: this.toRows(employeeAppointments),
        hasEvents: employeeAppointments.length > 0,
      };
    });

    const unassignedAppointments = grouped.get(UNASSIGNED_KEY) ?? [];
    columns.push({
      key: UNASSIGNED_KEY,
      name: "Sin asignar",
      color: null,
      employeeId: null,
      rows: this.toRows(unassignedAppointments),
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

    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }

  private toRows(appointments: Appointment[]): DayEventItem[][] {
    const rows: DayEventItem[][] = this.timeSlots.map(() => []);
    for (const appointment of appointments) {
      const start = new Date(appointment.start_time);
      if (Number.isNaN(start.getTime())) continue;
      const rowIndex = start.getHours() - this.startHourOfFirstSlot();
      if (rowIndex < 0 || rowIndex >= rows.length) continue;
      rows[rowIndex].push(this.toTimelineEvent(appointment));
    }
    return rows;
  }

  private startHourOfFirstSlot(): number {
    return this.timeSlots.length ? Number(this.timeSlots[0].slice(0, 2)) : DEFAULT_START_HOUR;
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
