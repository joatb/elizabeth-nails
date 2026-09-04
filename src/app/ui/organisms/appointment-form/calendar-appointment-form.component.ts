import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ModalController } from "@ionic/angular/standalone";
import { DateTime } from "luxon";
import { SharedModule } from "../../../modules/shared.module";
import { IonicSelectableComponent } from "ionic-selectable";
import { ClientsProvider } from "../../../providers/clients/clients.provider";
import { Client } from "../../../providers/clients/models/client";
import { Subscription } from "rxjs";
import { EventService } from "../../../services/event.service";
import { ServicesProvider } from "../../../providers/services/services.provider";
import { Service } from "../../../providers/services/models/service";
import { EmployeesProvider } from "../../../providers/employees/employees.provider";
import { Employee } from "../../../providers/employees/models/employee";
import { Appointment } from "../../../providers/appointments/models/appointment";

type ClientOption = { id: string; name: string };
type ServiceOption = { id: string; name: string; color: string; price: number };
type AppointmentSubmit = {
  id?: string;
  start_time: string;
  end_time: string;
  note: string;
  client_id: string;
  service_id?: string;
  employee_id?: string | null;
};
type ClientSearchEvent = { text: string };
type ClientInfiniteScrollEvent = {
  component: {
    endInfiniteScroll: () => void;
    disableInfiniteScroll: () => void;
    items: ClientOption[];
  };
  text: string;
};
type CalendarEventPayload = { name: string };

// Zona horaria fija del negocio: evita que la hora mostrada/guardada dependa
// de la zona horaria del dispositivo/navegador donde corre la app.
const BUSINESS_TIMEZONE = "Europe/Madrid";

// El input de fecha es un <input type="date"> nativo (formato interno siempre
// yyyy-MM-dd, independiente de cómo lo muestre el navegador). El de hora es un
// campo de texto en formato 24h HH:mm, para que no dependa del locale del SO.
const DATE_INPUT_FORMAT = "yyyy-LL-dd";
const TIME_INPUT_FORMAT = "HH:mm";
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

@Component({
  selector: "app-calendar-appointment-form",
  templateUrl: "./calendar-appointment-form.component.html",
  styleUrls: ["./calendar-appointment-form.component.scss"],
  imports: [SharedModule, ReactiveFormsModule, IonicSelectableComponent],
})
export class CalendarAppointmentFormComponent {
  form!: FormGroup;
  @Input() startTime: string = "";
  @Input() endTime: string = "";
  @Input() employeeId: string | null = null;
  @Input() appointment: Appointment | null = null;
  @Output() submitEvent = new EventEmitter<AppointmentSubmit>();

  protected clients: { total: number; documents: Client[] } | null = null;
  protected selectableClientsOptions: ClientOption[] = [];
  protected services: { total: number; documents: Service[] } | null = null;
  protected selectableServicesOptions: ServiceOption[] = [];
  protected employees: Employee[] = [];
  private eventsSubscription: Subscription | null = null;
  formSubmitted = false;

  // Variables para infinite scroll y búsqueda
  private currentOffset = 0;
  private readonly limit = 50;
  private isLoadingMore = false;
  private hasMoreClients = true;
  private currentSearchTerm = "";

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private clientsPvd: ClientsProvider,
    private servicesPvd: ServicesProvider,
    private employeesPvd: EmployeesProvider,
    private events: EventService,
  ) {}

  ionViewDidEnter() {
    this.subscribeToEvents();
  }
  ionViewDidLeave() {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async ngOnInit(): Promise<void> {
    this.subscribeToEvents();

    const referenceStart = this.appointment?.start_time || this.startTime;
    const referenceEnd = this.appointment?.end_time || this.endTime;
    const startDt = referenceStart
      ? DateTime.fromISO(referenceStart, { zone: BUSINESS_TIMEZONE })
      : DateTime.now().setZone(BUSINESS_TIMEZONE);
    const endDt = referenceEnd
      ? DateTime.fromISO(referenceEnd, { zone: BUSINESS_TIMEZONE })
      : DateTime.now().setZone(BUSINESS_TIMEZONE);

    this.form = this.fb.group({
      note: [this.appointment?.note ?? ""],
      client: ["", [Validators.required]],
      services: [""],
      employee: [this.appointment?.employee_id ?? this.employeeId ?? ""],
      startDate: [
        startDt.isValid ? startDt.toFormat(DATE_INPUT_FORMAT) : "",
        [Validators.required],
      ],
      startTimeOfDay: [
        startDt.isValid ? startDt.toFormat("HH:mm") : "",
        [Validators.required, Validators.pattern(TIME_PATTERN)],
      ],
      endDate: [
        endDt.isValid ? endDt.toFormat(DATE_INPUT_FORMAT) : "",
        [Validators.required],
      ],
      endTimeOfDay: [
        endDt.isValid ? endDt.toFormat("HH:mm") : "",
        [Validators.required, Validators.pattern(TIME_PATTERN)],
      ],
    });

    await Promise.all([this.loadInitialClients(), this.loadServices(), this.loadEmployees()]);

    if (this.appointment) {
      this.patchAppointment(this.appointment);
    }
  }

  private patchAppointment(appointment: Appointment): void {
    if (appointment.client && typeof appointment.client !== "string") {
      const clientOption: ClientOption = {
        id: appointment.client.id,
        name: appointment.client.name,
      };
      this.form.controls["client"].setValue(clientOption);
      if (!this.selectableClientsOptions.some((c) => c.id === clientOption.id)) {
        this.selectableClientsOptions = [clientOption, ...this.selectableClientsOptions];
      }
    }

    const service = appointment.services;
    if (service && typeof service !== "string") {
      const serviceOption: ServiceOption = {
        id: service.id,
        name: service.name,
        color: service.color,
        price: Number(service.price) || 0,
      };
      this.form.controls["services"].setValue(serviceOption);
    }

    if (appointment.employee_id) {
      this.form.controls["employee"].setValue(appointment.employee_id);
    }
  }

  ngOnDestroy() {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async submit(): Promise<void> {
    this.formSubmitted = true;
    if (this.form.valid) {
      const formValue = this.form.value;
      const selectedClient = formValue.client as ClientOption;
      const selectedService = formValue.services as ServiceOption | "";
      const startTime = this.combineDateTime(formValue.startDate, formValue.startTimeOfDay);
      const endTime = this.combineDateTime(formValue.endDate, formValue.endTimeOfDay);

      if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
        this.form.setErrors({ ...(this.form.errors ?? {}), dateRangeInvalid: true });
        return;
      }

      const payload: AppointmentSubmit = {
        ...(this.appointment?.id ? { id: this.appointment.id } : {}),
        start_time: startTime,
        end_time: endTime,
        note: formValue.note,
        client_id: selectedClient?.id,
        service_id:
          selectedService && typeof selectedService !== "string"
            ? selectedService.id
            : undefined,
        employee_id: formValue.employee || null,
      };

      this.modalCtrl.dismiss(payload);
    }
  }

  /**
   * Autoformatea mientras se escribe: inserta los dos puntos de HH:mm.
   */
  onTimeInput(controlName: string, event: Event): void {
    const digits = (event.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4);
    let formatted = digits.slice(0, 2);
    if (digits.length > 2) formatted += ":" + digits.slice(2, 4);
    this.form.controls[controlName].setValue(formatted);
  }

  /**
   * Combina una fecha (yyyy-LL-dd) y una hora (HH:mm) en un ISO string en UTC.
   */
  combineDateTime(dateStr: string, timeStr: string): string {
    return (
      DateTime.fromFormat(`${dateStr} ${timeStr}`, `${DATE_INPUT_FORMAT} ${TIME_INPUT_FORMAT}`, {
        zone: BUSINESS_TIMEZONE,
      })
        .toUTC()
        .toISO() ?? ""
    );
  }

  onClientChange(event: { value: ClientOption }): void {
    this.form.controls["client"].setValue(event.value);
  }

  onServiceChange(event: { value: ServiceOption }): void {
    this.form.controls["services"].setValue(event.value);
  }

  /**
   * Carga los clientes iniciales
   */
  private async loadInitialClients(): Promise<void> {
    try {
      this.clients = await this.clientsPvd.listClients(this.limit, 0);
      this.selectableClientsOptions =
        this.clients?.documents.map((client) => ({
          id: client.id,
          name: client.name,
        })) || [];

      this.currentOffset = this.limit;
      this.hasMoreClients = this.clients
        ? this.clients.documents.length === this.limit
        : false;
    } catch (error) {
      console.error("Error loading initial clients:", error);
      this.selectableClientsOptions = [];
    }
  }

  private async loadServices(): Promise<void> {
    try {
      this.services = await this.servicesPvd.listServices();
      this.selectableServicesOptions =
        this.services?.documents.map((service) => ({
          id: service.id,
          name: service.name,
          color: service.color,
          price: Number(service.price) || 0,
        })) || [];
    } catch (error) {
      console.error("Error loading services:", error);
      this.selectableServicesOptions = [];
    }
  }

  private async loadEmployees(): Promise<void> {
    try {
      this.employees = await this.employeesPvd.listActiveEmployees();
    } catch (error) {
      console.error("Error loading employees:", error);
      this.employees = [];
    }
  }

  /**
   * Maneja la búsqueda de clientes
   */
  async onClientSearch(event: ClientSearchEvent): Promise<void> {
    const searchTerm = event.text?.trim();
    this.currentSearchTerm = searchTerm;

    if (!searchTerm || searchTerm.length === 0) {
      // Si no hay término de búsqueda, cargar clientes iniciales
      await this.loadInitialClients();
      return;
    }

    try {
      // Buscar clientes por nombre en la base de datos
      const searchResults =
        await this.clientsPvd.searchClientsByName(searchTerm);
      this.selectableClientsOptions = searchResults.map((client) => ({
        id: client.id,
        name: client.name,
      }));

      // Resetear variables de paginación para búsqueda
      this.currentOffset = 0;
      this.hasMoreClients = false; // Para búsquedas no usamos infinite scroll
    } catch (error) {
      console.error("Error searching clients:", error);
      this.selectableClientsOptions = [];
    }
  }

  /**
   * Maneja la carga de más clientes (infinite scroll)
   */
  async onClientLoadMore(event: ClientInfiniteScrollEvent): Promise<void> {
    // Si está cargando o hay búsqueda activa, no hacer nada
    if (this.isLoadingMore || this.currentSearchTerm) {
      event.component.endInfiniteScroll();
      return;
    }

    // Si no hay más clientes, deshabilitar infinite scroll
    if (!this.hasMoreClients) {
      event.component.disableInfiniteScroll();
      return;
    }

    this.isLoadingMore = true;

    try {
      const moreClients = await this.clientsPvd.listClients(
        this.limit,
        this.currentOffset,
      );

      if (moreClients && moreClients.documents.length > 0) {
        const newOptions = moreClients.documents.map((client) => ({
          id: client.id,
          name: client.name,
        }));

        // Concatenar con los items existentes del componente
        const allOptions = event.component.items.concat(newOptions);
        event.component.items = allOptions;

        // Actualizar también nuestra variable local
        this.selectableClientsOptions = allOptions;
        this.currentOffset += this.limit;

        // Solo deshabilitar si recibimos menos clientes de los esperados
        this.hasMoreClients = moreClients.documents.length === this.limit;
      } else {
        this.hasMoreClients = false;
      }
    } catch (error) {
      console.error("Error loading more clients:", error);
      this.hasMoreClients = false;
    } finally {
      this.isLoadingMore = false;

      // Finalizar el infinite scroll según la documentación
      event.component.endInfiniteScroll();

      // Solo deshabilitar infinite scroll si no hay más clientes
      if (!this.hasMoreClients) {
        event.component.disableInfiniteScroll();
      }
    }
  }

  async subscribeToEvents(): Promise<void> {
    this.eventsSubscription = this.events
      .getObservable()
      .subscribe(async (event: CalendarEventPayload) => {
        if (event.name === "submit") {
          this.formSubmitted = true;
          if (this.form.valid) {
            const selectedClient = this.form.controls["client"]
              .value as ClientOption;
            const selectedService = this.form.controls["services"]
              .value as ServiceOption | "";
            const startTime = this.combineDateTime(
              this.form.controls["startDate"].value,
              this.form.controls["startTimeOfDay"].value,
            );
            const endTime = this.combineDateTime(
              this.form.controls["endDate"].value,
              this.form.controls["endTimeOfDay"].value,
            );

            if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
              this.form.setErrors({ ...(this.form.errors ?? {}), dateRangeInvalid: true });
              return;
            }

            const appointment: AppointmentSubmit = {
              ...(this.appointment?.id ? { id: this.appointment.id } : {}),
              start_time: startTime,
              end_time: endTime,
              note: this.form.controls["note"].value,
              client_id: selectedClient.id,
              service_id:
                selectedService && typeof selectedService !== "string"
                  ? selectedService.id
                  : undefined,
              employee_id: this.form.controls["employee"].value || null,
            };
            this.submitEvent.emit(appointment);
          }
        }
      });
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return (
      !!control && control.invalid && (control.touched || this.formSubmitted)
    );
  }
}
