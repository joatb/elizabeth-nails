/**
 * elizabeth-nails/elizabeth-nails-app/src/app/features/calendar/calendar.page.ts
 *
 * Reescritura del componente CalendarPage:
 * - Imports normalizados (uso de barrels desde `../../ui` cuando procede).
 * - Guards y comprobaciones nulas para cumplir con TypeScript strict.
 * - Mantiene la responsabilidad: la página gestiona la vista del calendario (FullCalendar)
 *   y la carga de datos necesarios (schedules/appointments).
 *
 * Nota: este archivo está diseñado para integrarse con las moléculas/organismos ya atomizados
 * en `src/app/ui` (por ejemplo la molécula de tabla de horarios).
 */

import {
  Component,
  ViewChild,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import {
  FullCalendarComponent,
  FullCalendarModule,
} from "@fullcalendar/angular";
import { CalendarApi, CalendarOptions, EventInput } from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";

import {
  ActionSheetController,
  AlertController,
  ModalController,
} from "@ionic/angular";

import { LogOut, Clock, EllipsisVertical, Columns3, CalendarClock } from "lucide-angular";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";

import { Day } from "../../models/day";
import { SharedModule } from "../../modules/shared.module";
import { AppointmentsProvider } from "../../providers/appointments/appointments.provider";
import { Appointment } from "../../providers/appointments/models/appointment";
import { Schedule } from "../../providers/schedules/models/schedule";
import { SchedulesProvider } from "../../providers/schedules/schedules.provider";
import { ServicesProvider } from "../../providers/services/services.provider";
import { Service } from "../../providers/services/models/service";
import { EmployeesProvider } from "../../providers/employees/employees.provider";
import { Employee } from "../../providers/employees/models/employee";
import { AlertService } from "../../services/alert.service";
import { AuthService } from "../../services/auth.service";
import { EventService } from "../../services/event.service";
import { AppointmentProximityService } from "../../services/appointment-proximity.service";

import {
  CalendarAppointmentModalComponent,
  CalendarEventInfoComponent,
  CalendarScheduleModalComponent,
  CalendarToolbarComponent,
  MonthPickerModalComponent,
  EmployeesColumnsViewComponent,
} from "../../ui";
import { CalendarDayEventsModalComponent } from "../../ui/organisms/day-events-modal/calendar-day-events-modal";
import { DayEventItem } from "../../ui/molecules/mol-day-event-item/mol-day-event-item.component";

import { ConfigModalComponent } from "../../components/modals/config-modal/config-modal.component";

@Component({
  selector: "app-calendar",
  templateUrl: "calendar.page.html",
  styleUrls: ["calendar.page.scss"],
  standalone: true,
  imports: [
    SharedModule,
    FullCalendarModule,
    CalendarToolbarComponent,
    MonthPickerModalComponent,
    CalendarScheduleModalComponent,
    ConfigModalComponent,
    EmployeesColumnsViewComponent,
  ],
})
export class CalendarPage implements OnDestroy {
  readonly LogOut = LogOut;
  readonly Clock = Clock;
  readonly EllipsisVertical = EllipsisVertical;
  readonly Columns3 = Columns3;
  readonly CalendarClock = CalendarClock;

  // Datos para agenda
  schedules: { total: number; documents: Schedule[] } | null = null;
  appointments: { total: number; documents: Appointment[] } | null = null;
  services: { total: number; documents: Service[] } | null = null;
  employees: Employee[] = [];
  private servicesById = new Map<string, Service>();

  viewMode: "day" | "employees" = "day";
  selectedDate: Date = new Date();

  calendarOptions?: CalendarOptions;

  @ViewChild("calendar") private calendarComponent!: FullCalendarComponent;

  private calendarApi?: CalendarApi;
  private eventsSubscription: Subscription | null = null;
  isLoadingEvents = false;

  isMonthPickerOpen = false;
  monthPickerValue: string =
    DateTime.local().startOf("month").toISODate() ?? "";

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private appointmentsPvd: AppointmentsProvider,
    private servicesPvd: ServicesProvider,
    private employeesPvd: EmployeesProvider,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private alertService: AlertService,
    private events: EventService,
    private modalController: ModalController,
    private cdr: ChangeDetectorRef,
    private proximityService: AppointmentProximityService,
  ) {
    // Configuración base de FullCalendar
    this.calendarOptions = {
      timeZone: "local",
      initialView: "dayGridMonth",
      locale: esLocale,
      navLinks: true,
      titleFormat: { year: "numeric", month: "long", day: "numeric" },
      headerToolbar: {
        start: "title",
        center: "",
        end: "prev todayButton next monthPicker dayGridMonth,timeGridDay",
      },
      customButtons: {
        todayButton: {
          text: "Mes actual",
          hint: "Volver al mes actual",
          click: () => this.goToToday(),
        },
        monthPicker: {
          text: "📅",
          hint: "Seleccionar mes",
          click: () => this.openMonthPicker(),
        },
      },
      displayEventEnd: true,
      nowIndicator: true,
      plugins: [timeGridPlugin, dayGridPlugin, listPlugin, interactionPlugin],
      dateClick: (arg: any) => this.handleDateClick(arg),
      moreLinkClick: (arg: any) => this.handleMoreLinkClick(arg),
      eventClick: (info: any) => this.handleEventClick(info),
      eventDidMount: (info: any) => this.prependEmployeeDot(info),
      dayMaxEventRows: true,
      eventColor: "var(--ion-color-primary)",
      eventTimeFormat: {
        hour: "2-digit",
        minute: "2-digit",
        meridiem: false,
      },
      eventOverlap: false,
      eventConstraint: {
        startTime: "00:00",
        endTime: "24:00",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      eventDisplay: "block",
      eventMaxStack: 4,
    };
  }

  ngAfterViewInit(): void {
    if (this.calendarComponent) {
      try {
        this.calendarApi = this.calendarComponent.getApi();
      } catch {
        // En casos raros la API puede no estar disponible inmediatamente
        this.calendarApi = undefined;
      }
    }

    if (this.calendarOptions) {
      // Establecer callback para cuando cambien las fechas (ej. paginación)
      this.calendarOptions.datesSet = () => {
        this.fetchAppointments().catch(() => {});
        this.updateTodayButtonVisibility();
      };
    }

    void this.initialize();
  }

  ionViewDidEnter(): void {
    this.subscribeToEvents();
    // Refrescar empleados por si se crearon/editaron/eliminaron mientras esta
    // pestaña estaba desuscrita de eventos (p.ej. estando en la pestaña Empleados).
    void this.fetchEmployees();
    // Forzar un resize para que FullCalendar calcule correctamente su tamaño
    setTimeout(() => window.dispatchEvent(new Event("resize")), 1);
  }

  ionViewDidLeave(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  private async initialize(): Promise<void> {
    await this.fetchServices();
    await Promise.all([this.fetchAppointments(), this.fetchSchedules(), this.fetchEmployees()]);
    this.updateTodayButtonVisibility();
  }

  private async fetchEmployees(): Promise<void> {
    try {
      this.employees = await this.employeesPvd.listActiveEmployees();
    } catch (err) {
      console.error("Error cargando employees:", err);
      this.employees = [];
    }
  }

  setViewMode(mode: "day" | "employees"): void {
    this.viewMode = mode;
    if (mode === "day") {
      // El full-calendar estuvo colapsado (height: 0) mientras se veía la vista de
      // columnas; sin esto no vuelve a medir su contenedor y el grid sale roto.
      setTimeout(() => this.calendarApi?.updateSize(), 0);
    }
  }

  selectedDayAppointments: Appointment[] = [];

  private recomputeSelectedDayAppointments(): void {
    if (!Array.isArray(this.appointments?.documents)) {
      this.selectedDayAppointments = [];
      return;
    }
    const dayStr = DateTime.fromJSDate(this.selectedDate).toFormat("yyyy-LL-dd");
    this.selectedDayAppointments = this.appointments.documents.filter(
      (a) => DateTime.fromISO(a.start_time).toFormat("yyyy-LL-dd") === dayStr,
    );
  }

  // Recarga completa del calendario (usado externamente)
  public reload(): void {
    void this.initialize();
  }

  // Cargar horarios (schedules) y mapear businessHours en la configuración del calendario
  private async fetchSchedules(): Promise<void> {
    try {
      this.schedules = await this.schedulesPvd.listSchedules();

      const businessHours: Array<Record<string, unknown>> = Array.isArray(
        this.schedules?.documents,
      )
        ? this.schedules!.documents.map((s: any) => ({
            daysOfWeek: Array.isArray(s.days)
              ? s.days
                  .map((d: any) => {
                    const n = Number(d);
                    return Number.isNaN(n) ? null : n === 7 ? 0 : n;
                  })
                  .filter((n: number | null): n is number => n !== null)
              : [],
            startTime: s.start_time,
            endTime: s.end_time,
          }))
        : [];

      if (this.calendarOptions) {
        this.calendarOptions.businessHours = businessHours;
      }
      this.recomputeEmployeesViewHourRange();
    } catch (err) {
      // Log mínimamente y no romper la página
      // eslint-disable-next-line no-console
      console.error("Error cargando schedules:", err);
      this.schedules = null;
      if (this.calendarOptions) {
        this.calendarOptions.businessHours = [];
      }
      this.recomputeEmployeesViewHourRange();
    }
  }

  private async fetchServices(): Promise<void> {
    try {
      this.services = await this.servicesPvd.listServices();
      this.servicesById = new Map(
        (this.services?.documents ?? []).map((service) => [service.id, service]),
      );
    } catch (err) {
      console.error("Error cargando services:", err);
      this.services = null;
      this.servicesById = new Map();
    }
  }

  // Cargar citas (appointments) para el rango de meses que nos interesa
  private async fetchAppointments(): Promise<void> {
    this.isLoadingEvents = true;
    this.cdr.detectChanges();

    try {
      // Garantizar existencia de API calendario
      if (!this.calendarApi) {
        // Intentar obtenerla de nuevo si es posible
        if (
          this.calendarComponent &&
          typeof this.calendarComponent.getApi === "function"
        ) {
          this.calendarApi = this.calendarComponent.getApi();
        }
      }
      if (!this.calendarApi) {
        this.isLoadingEvents = false;
        return;
      }

      const calendarDate = this.calendarApi.getDate();
      if (!calendarDate) {
        this.isLoadingEvents = false;
        return;
      }

      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth() + 1;

      // Rango: primer día del mes anterior -> último día del mes siguiente
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear--;
      }
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth === 13) {
        nextMonth = 1;
        nextYear++;
      }

      const startDate = new Date(prevYear, prevMonth - 1, 1);
      const endDate = new Date(nextYear, nextMonth, 0);

      this.appointments = await this.appointmentsPvd.listAppointmentsInRange(
        startDate,
        endDate,
      );

      const events: EventInput[] = Array.isArray(this.appointments?.documents)
        ? this.appointments!.documents.map((appointment: Appointment) => {
            const service = this.resolveService(appointment);
            return {
              title:
                typeof appointment.client === "string"
                  ? "—"
                  : appointment.client?.name ?? "—",
              start: appointment.start_time,
              end: appointment.end_time,
              color: service?.color ?? "var(--ion-color-primary)",
              extendedProps: {
                id: appointment.id,
                description: appointment.note,
                phone_country:
                  typeof appointment.client === "string"
                    ? ""
                    : appointment.client?.phone_country,
                phone:
                  typeof appointment.client === "string"
                    ? ""
                    : appointment.client?.phone,
                serviceId: service?.id,
                serviceName: service?.name,
                serviceColor: service?.color,
                employeeName: appointment.employee?.name ?? null,
                employeeColor: appointment.employee?.color ?? null,
              },
            };
          })
        : [];

      if (this.calendarOptions) {
        this.calendarOptions.events = events;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Error cargando appointments:", err);
      this.appointments = null;
      if (this.calendarOptions) {
        this.calendarOptions.events = [];
      }
    } finally {
      this.recomputeSelectedDayAppointments();
      this.isLoadingEvents = false;
      this.cdr.detectChanges();
    }
  }

  openMonthPicker(): void {
    if (!this.calendarApi) return;
    const currentDate = this.calendarApi.getDate();
    this.monthPickerValue =
      DateTime.fromJSDate(currentDate).startOf("month").toISODate() ??
      this.monthPickerValue;
    this.isMonthPickerOpen = true;
  }

  cancelMonthPicker(): void {
    this.isMonthPickerOpen = false;
  }

  onMonthPickerDismiss(): void {
    this.isMonthPickerOpen = false;
  }

  confirmMonthPicker(selectedValue: string | null): void {
    if (!selectedValue || !this.calendarApi) {
      this.isMonthPickerOpen = false;
      return;
    }

    const iso =
      selectedValue.length === 7 ? `${selectedValue}-01` : selectedValue;
    const dt = DateTime.fromISO(iso);
    if (!dt.isValid) {
      this.isMonthPickerOpen = false;
      return;
    }

    // Ir al primer día del mes seleccionado y garantizar vista mensual
    this.monthPickerValue =
      dt.startOf("month").toISODate() ?? this.monthPickerValue;
    this.calendarApi.gotoDate(dt.startOf("month").toJSDate());
    this.calendarApi.changeView("dayGridMonth");

    setTimeout(() => this.updateTodayButtonVisibility(), 100);
    this.isMonthPickerOpen = false;
  }

  goToToday(): void {
    if (!this.calendarApi) return;
    this.calendarApi.today();
    this.calendarApi.changeView("dayGridMonth");
    setTimeout(() => this.updateTodayButtonVisibility(), 100);
  }

  private updateTodayButtonVisibility(): void {
    if (!this.calendarApi) return;
    const currentDate = this.calendarApi.getDate();
    if (!currentDate) return;

    const today = new Date();
    const isCurrentMonth =
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();

    const todayButton = document.querySelector(
      ".fc-todayButton-button",
    ) as HTMLElement | null;
    if (!todayButton) return;

    if (isCurrentMonth) {
      todayButton.setAttribute("disabled", "true");
      todayButton.style.opacity = "0.5";
    } else {
      todayButton.removeAttribute("disabled");
      todayButton.style.opacity = "1";
    }
  }

  // Añade un pequeño punto con el color del empleado asignado al inicio de cada evento
  private prependEmployeeDot(info: any): void {
    const titleEl = info.el.querySelector(".fc-event-title");
    if (!titleEl || titleEl.querySelector(".fc-employee-dot")) return;

    const color = info.event.extendedProps?.employeeColor;
    const dot = document.createElement("span");
    dot.className = "fc-employee-dot";
    if (color) {
      dot.style.background = color;
      dot.style.border = "1.5px solid #fff";
    } else {
      dot.style.background = "transparent";
      dot.style.border = "1.5px dashed rgba(255, 255, 255, 0.7)";
    }
    if (info.event.extendedProps?.employeeName) {
      dot.title = info.event.extendedProps.employeeName;
    }
    titleEl.prepend(dot);
  }

  // Manejo de clicks en fechas: abre modal con eventos del día si es día de negocio
  private async handleDateClick(arg: any): Promise<void> {
    // Asegurar existencia de arg y de fecha
    const dateStr = arg?.dateStr ?? arg?.date?.toString();
    if (!dateStr) return;
    if (!this.checkIfBusinessDay(new Date(dateStr))) return;
    const dateObj = new Date(dateStr);

    if (this.viewMode === "employees") {
      this.selectedDate = dateObj;
      this.recomputeSelectedDayAppointments();
      this.recomputeEmployeesViewHourRange();
      return;
    }

    const dayStr = dateObj.toISOString().substring(0, 10);
    const eventsForDay = Array.isArray(this.appointments?.documents)
      ? this.appointments!.documents
          .filter((ev: Appointment) => String(ev.start_time).startsWith(dayStr))
          .map((ev: Appointment) => {
            const service = this.resolveService(ev);
            return {
              ...ev,
              service_name: service?.name ?? null,
              service_color: service?.color ?? null,
            };
          })
      : [];
    // Abrir modal (uso de import estático del componente)
    const modal = await this.modalController.create({
      component: CalendarDayEventsModalComponent,
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      componentProps: {
        date: dateObj,
        events: eventsForDay,
      },
    });
    await modal.present();
    await modal.onDidDismiss();
  }

  // Manejo de click en evento: delega a handleDateClick (simplificado)
  private async handleEventClick(info: any): Promise<void> {
    const start = info?.event?.start;
    if (!start) return;
    await this.handleDateClick({ dateStr: start.toString() });
  }

  // Manejo del enlace "more" de fullcalendar para mostrar modal
  private handleMoreLinkClick(arg: any): string {
    if (arg && arg.date) {
      arg.dateStr = arg.date.toString();
      void this.handleDateClick(arg);
    }
    return "dayGridMonth";
  }

  // Comprueba si una fecha cae dentro de los horarios de negocio (schedules)
  private checkIfBusinessHours(date: Date): boolean {
    if (!this.schedules?.documents || !Array.isArray(this.schedules.documents))
      return false;

    const time = date.toTimeString().split(" ")[0]; // HH:MM:SS
    return this.schedules.documents.some((schedule: any) => {
      const startTime = schedule?.start_time;
      const endTime = schedule?.end_time;
      if (!startTime || !endTime) return false;
      const start = new Date(`1970-01-01T${startTime}:00`);
      const end = new Date(`1970-01-01T${endTime}:00`);
      const currentTime = new Date(`1970-01-01T${time}`);
      return currentTime >= start && currentTime <= end;
    });
  }

  // Rango de horas configurado (schedules) para el día seleccionado, cacheado para
  // no recalcularse en cada ciclo de detección de cambios (ver bug de congelación).
  employeesViewHourRange: { startHour: number; endHour: number } | null = null;

  private recomputeEmployeesViewHourRange(): void {
    this.employeesViewHourRange = this.getBusinessHourRangeForDate(this.selectedDate);
  }

  // Rango de horas configurado (schedules) para el día indicado, usado por la vista
  // de columnas por empleado en vez de una franja fija.
  private getBusinessHourRangeForDate(date: Date): { startHour: number; endHour: number } | null {
    if (!this.schedules?.documents || !Array.isArray(this.schedules.documents)) return null;

    const weekday = date.getDay();
    const applicable = this.schedules.documents.filter((schedule: any) => {
      const days: number[] = Array.isArray(schedule.days)
        ? schedule.days
            .map((d: any) => {
              const n = Number(d);
              return Number.isNaN(n) ? null : n === 7 ? 0 : n;
            })
            .filter((n: number | null): n is number => n !== null)
        : [];
      return days.includes(weekday);
    });

    if (applicable.length === 0) return null;

    let startHour = Infinity;
    let endHour = -Infinity;
    for (const schedule of applicable as any[]) {
      const start = Number(String(schedule.start_time ?? "").split(":")[0]);
      const end = Number(String(schedule.end_time ?? "").split(":")[0]);
      if (!Number.isNaN(start)) startHour = Math.min(startHour, start);
      if (!Number.isNaN(end)) endHour = Math.max(endHour, end);
    }

    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) return null;
    return { startHour, endHour };
  }

  // Comprueba si la fecha es un día de negocio según schedules
  private checkIfBusinessDay(date: Date): boolean {
    if (!this.schedules?.documents || !Array.isArray(this.schedules.documents))
      return false;
    return this.schedules.documents.some((schedule: any) => {
      const days: number[] = Array.isArray(schedule.days)
        ? schedule.days
            .map((d: any) => {
              const n = Number(d);
              return Number.isNaN(n) ? null : n === 7 ? 0 : n;
            })
            .filter((n: number | null): n is number => n !== null)
        : [];
      return days.includes(date.getDay());
    });
  }

  // Obtiene los days del mes actual que son días de negocio
  private getDaysCurrentMonth(): Day[] {
    const now = new Date();
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const result: Day[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), i);
      if (this.checkIfBusinessDay(d)) {
        result.push(new Day(d));
      }
    }
    return result;
  }

  // Construye schedules + appointments por día
  private getSchedulesAndAppointments(): Day[] {
    const days = this.getDaysCurrentMonth();
    days.forEach((day) => {
      day.schedule = Array.isArray(this.schedules?.documents)
        ? this.schedules!.documents.filter((s: any) => {
            const days: number[] = Array.isArray(s.days)
              ? s.days
                  .map((d: any) => {
                    const n = Number(d);
                    return Number.isNaN(n) ? null : n === 7 ? 0 : n;
                  })
                  .filter((n: number | null): n is number => n !== null)
              : [];
            return days.includes(day.date.getDay());
          })
        : [];
      day.appointments = Array.isArray(this.appointments?.documents)
        ? this.appointments!.documents.filter((a: any) =>
            String(a.start_time).startsWith(day.date.toISOString()),
          )
        : [];
    });
    return days;
  }

  // Flujos auxiliares del feature "añadir cita"
  public async addAppointment(): Promise<void> {
    const hours = await this.askForHours();
    if (hours === null) return;

    const days = this.getSchedulesAndAppointments();
    let done = false;
    let availableGapsCount = 0;

    outerLoop: for await (const day of days) {
      if (done) break;
      const availableGaps = day.getAvailableHourGapsByHoursAndSchedules(hours);
      for await (const availableGap of availableGaps) {
        if (!availableGap) continue;
        availableGapsCount++;
        const alertResult = await this.showAlert({
          date: DateTime.fromJSDate(day.date, { zone: "system" }).toFormat(
            "dd-MM-yyyy",
          ),
          start: DateTime.fromJSDate(availableGap.start, {
            zone: "system",
          }).toFormat("H:mm"),
          end: DateTime.fromJSDate(availableGap.end, {
            zone: "system",
          }).toFormat("H:mm"),
        });

        if (alertResult === "accepted") {
          done = true;
          await this.openAppointmentFormModal(
            day,
            availableGap.start,
            availableGap.end,
          );
          break outerLoop;
        } else if (alertResult === "next") {
          continue;
        } else {
          break outerLoop;
        }
      }
    }

    if (availableGapsCount === 0) {
      await this.alertService.presentToast(
        "No hay horas disponibles para este mes",
        2500,
      );
    }
  }

  private async askForHours(): Promise<number | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: "Horas necesarias",
        message: "¿Cuántas horas necesitas para la cita?",
        inputs: [
          {
            name: "hours",
            type: "number",
            placeholder: "Introduce el número de horas",
            min: 1,
          },
        ],
        buttons: [
          {
            text: "Aceptar",
            handler: (data: any) => {
              const hours = parseInt(String(data?.hours ?? ""), 10);
              if (!Number.isNaN(hours) && hours > 0) {
                resolve(hours);
              } else {
                resolve(null);
              }
            },
          },
          {
            text: "Cancelar",
            role: "cancel",
            handler: () => resolve(null),
          },
        ],
      });

      await alert.present();
    });
  }

  private async openAppointmentFormModal(
    day: Day,
    startTime: Date,
    endTime: Date,
  ): Promise<void> {
    const modal = await this.modalController.create({
      component: CalendarAppointmentModalComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      componentProps: {
        day,
        startTime: DateTime.fromJSDate(startTime, { zone: "system" }).toISO(),
        endTime: DateTime.fromJSDate(endTime, { zone: "system" }).toISO(),
      },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.saveAppointment(data);
    }
  }

  private async showAlert(availableRange: {
    date: string;
    start: string;
    end: string;
  }): Promise<string> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: "Cita disponible",
        message: `Cita disponible el día ${availableRange.date} desde ${availableRange.start} hasta ${availableRange.end}`,
        buttons: [
          { text: "Aceptar", handler: () => resolve("accepted") },
          { text: "Siguiente", handler: () => resolve("next") },
          {
            text: "Cancelar",
            role: "cancel",
            handler: () => resolve("cancel"),
          },
        ],
      });
      await alert.present();
    });
  }

  private async saveAppointment(appointment: {
    id?: string;
    note: string;
    start_time: string;
    end_time: string;
    client_id: string;
    service_id?: string;
    employee_id?: string | null;
  }): Promise<void> {
    const { id, ...changes } = appointment;
    if (id) {
      const original = this.appointments?.documents.find((a) => a.id === id);
      if (original) {
        const proceed = await this.proximityService.confirmIfNeeded(this.alertCtrl, original, changes);
        if (!proceed) return;
      }
      await this.appointmentsPvd.updateAppointment(id, changes);
      await this.alertService.presentToast("Cita actualizada", 2500);
    } else {
      await this.appointmentsPvd.createAppointment(changes);
      this.events.push("appointment.created", changes);
      await this.alertService.presentToast("Cita creada", 2500);
    }
    this.reload();
  }

  async onEmployeesColumnAdd(payload: { employeeId: string | null }): Promise<void> {
    const baseDate = DateTime.fromJSDate(this.selectedDate, { zone: "system" });
    const modal = await this.modalController.create({
      component: CalendarAppointmentModalComponent,
      initialBreakpoint: 1,
      breakpoints: [0, 0.25, 0.5, 0.75, 1],
      componentProps: {
        day: this.selectedDate,
        startTime: baseDate.set({ hour: 9, minute: 0, second: 0, millisecond: 0 }).toISO(),
        endTime: baseDate.set({ hour: 10, minute: 0, second: 0, millisecond: 0 }).toISO(),
        employeeId: payload.employeeId,
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.saveAppointment(data);
    }
  }

  async onEmployeesColumnEdit(event: DayEventItem): Promise<void> {
    if (!event.id) return;
    const original = this.appointments?.documents.find((a) => a.id === event.id);
    if (!original) {
      await this.alertService.presentErrorToast("No se pudo cargar la cita", 2500);
      return;
    }

    const modal = await this.modalController.create({
      component: CalendarAppointmentModalComponent,
      initialBreakpoint: 0.5,
      breakpoints: [0, 0.25, 0.5, 0.75],
      componentProps: {
        day: this.selectedDate,
        startTime: original.start_time,
        endTime: original.end_time,
        appointment: original,
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.saveAppointment(data);
    }
  }

  onEmployeesDateChange(newDate: Date): void {
    this.selectedDate = newDate;
    this.recomputeSelectedDayAppointments();
    this.recomputeEmployeesViewHourRange();
  }

  async onEmployeesColumnReassign(payload: { appointmentId: string; employeeId: string | null }): Promise<void> {
    try {
      await this.appointmentsPvd.updateAppointment(payload.appointmentId, {
        employee_id: payload.employeeId,
      });
      this.reload();
    } catch (error) {
      await this.alertService.presentErrorToast("No se pudo reasignar la cita", 2500);
    }
  }

  async onEmployeesColumnDelete(event: DayEventItem): Promise<void> {
    if (!event.id) return;
    const original = this.appointments?.documents.find((a) => a.id === event.id);
    const baseMessage = "¿Estás seguro de que deseas eliminar esta cita?";
    const message = original
      ? this.proximityService.buildDeleteWarningMessage(baseMessage, original.start_time)
      : baseMessage;

    const alert = await this.alertCtrl.create({
      header: "Confirmar eliminación",
      message,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            await this.appointmentsPvd.deleteAppointment(event.id!);
            await this.alertService.presentToast("Cita eliminada correctamente", 2500);
            this.reload();
          },
        },
      ],
    });
    await alert.present();
  }

  private resolveService(appointment: Appointment): Service | null {
    const rawService = appointment.services;
    if (!rawService) {
      return appointment.service_id ? this.servicesById.get(appointment.service_id) ?? null : null;
    }

    if (Array.isArray(rawService)) {
      const first = rawService[0];
      if (!first) return null;
      if (typeof first === "string") {
        return this.servicesById.get(first) ?? null;
      }
      return this.servicesById.get(first.id) ?? first;
    }

    if (typeof rawService === "string") {
      return this.servicesById.get(rawService) ?? null;
    }

    return this.servicesById.get(rawService.id) ?? rawService;
  }

  private subscribeToEvents(): void {
    if (this.eventsSubscription) return;
    this.eventsSubscription = this.events.getObservable().subscribe((event) => {
      if (event?.name === "add.event") {
        void this.addAppointment();
      }
      if (event?.name === "appointments.changed") {
        this.reload();
      }
      if (event?.name === "employees.changed") {
        void this.fetchEmployees();
      }
    });
  }
}
