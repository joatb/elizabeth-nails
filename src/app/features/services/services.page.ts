import { CommonModule, CurrencyPipe } from "@angular/common";
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from "@angular/core";
import { AlertController, ModalController } from "@ionic/angular/standalone";
import { Chart, registerables } from "chart.js";
import { LogOut } from "lucide-angular";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";
import { AtomSpinnerComponent, ClientsToolbarComponent } from "../../ui";
import { MonthPickerModalComponent } from "../../ui/organisms/month-picker-modal/month-picker-modal.component";
import { SharedModule } from "../../modules/shared.module";
import { ServicesProvider } from "../../providers/services/services.provider";
import { Service } from "../../providers/services/models/service";
import { AppointmentsProvider } from "../../providers/appointments/appointments.provider";
import { Appointment } from "../../providers/appointments/models/appointment";
import { Client } from "../../providers/clients/models/client";
import { ClientsStateService } from "../../services/clients-state.service";
import { AuthService } from "../../services/auth.service";
import { AlertService } from "../../services/alert.service";
import { EventService } from "../../services/event.service";
import { ServiceFormPage } from "../../ui/organisms/service-form/service-form.page";
import { ColorTheme, ThemeService } from "src/app/services/theme.service";

Chart.register(...registerables);

type ServiceUsage = {
  serviceId: string;
  name: string;
  count: number;
};

type ClientRanking = {
  clientName: string;
  clientPhone?: string;
  count: number;
};

@Component({
  selector: "app-services",
  templateUrl: "services.page.html",
  styleUrls: ["services.page.scss"],
  imports: [
    CommonModule,
    SharedModule,
    ClientsToolbarComponent,
    CurrencyPipe,
    AtomSpinnerComponent,
    MonthPickerModalComponent,
  ],
})
export class ServicesPage implements AfterViewInit, OnDestroy {
  readonly LogOut = LogOut;
  readonly earnedColor = "#2AF527";
  readonly pendingColor = "#ff6b35";
  @ViewChild("usageChartCanvas")
  private usageChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild("revenueChartCanvas")
  private revenueChartCanvas?: ElementRef<HTMLCanvasElement>;

  services: Service[] = [];
  appointments: Appointment[] = [];
  clientsById = new Map<string, Client>();

  serviceUsage: ServiceUsage[] = [];
  clientRanking: ClientRanking[] = [];
  totalEarned = 0;
  totalPending = 0;
  totalServices = 0;
  topServiceName = "—";
  topServiceCount = 0;
  topClientName = "—";
  topClientPhone = "";
  topClientCount = 0;
  currentTheme: ColorTheme | null = null;
  isLoading = false;
  filterMonth = ServicesPage.currentMonthStr();
  isMonthPickerOpen = false;
  monthPickerValue = `${ServicesPage.currentMonthStr()}-01`;

  private static currentMonthStr(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  private monthRange(): { start: Date; end: Date } {
    const [year, month] = this.filterMonth.split("-").map(Number);
    return {
      start: new Date(year, month - 1, 1, 0, 0, 0),
      end: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  get filterMonthLabel(): string {
    const dt = DateTime.fromISO(`${this.filterMonth}-01`).setLocale("es");
    const label = dt.isValid ? dt.toFormat("LLLL yyyy") : this.filterMonth;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  private usageChart: Chart | null = null;
  private revenueChart: Chart | null = null;
  private eventsSubscription: Subscription | null = null;
  

  constructor(
    protected authService: AuthService,
    private servicesProvider: ServicesProvider,
    private appointmentsProvider: AppointmentsProvider,
    private clientsState: ClientsStateService,
    private alertCtrl: AlertController,
    private alertService: AlertService,
    private modalCtrl: ModalController,
    private events: EventService,
    private themeService: ThemeService,
  ) {}

  async ngAfterViewInit(): Promise<void> {
    this.subscribeToEvents();
  }

  async ionViewDidEnter(): Promise<void> {
    this.subscribeToEvents();
    await this.loadData();
  }

  ionViewDidLeave(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  ngOnDestroy(): void {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
    this.destroyCharts();
  }

  trackByServiceId(_: number, service: Service): string {
    return service.id;
  }

  async addService(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ServiceFormPage,
      componentProps: {
        title: "Nuevo servicio",
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    await this.servicesProvider.createService({
      name: data.name,
      description: data.description ?? "",
      price: Number(data.price) || 0,
      color: data.color ?? this.currentTheme?.primary ?? "#5e81ac",
    });
    await this.alertService.presentToast("Servicio creado", 2500);
    await this.loadData();
  }

  async editService(service: Service): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ServiceFormPage,
      componentProps: {
        title: "Editar servicio",
        service: {
          name: service.name,
          description: service.description,
          price: Number(service.price) || 0,
          color: service.color,
        },
      },
    });
    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (!data) return;

    try {
      await this.servicesProvider.updateService(service.id, {
        name: data.name,
        description: data.description ?? "",
        price: Number(data.price) || 0,
        color: data.color ?? this.currentTheme?.primary ?? "#5e81ac",
      });
      await this.alertService.presentToast("Servicio actualizado", 2500);
      await this.loadData();
    } catch (error) {
      await this.alertService.presentErrorToast("No se pudo actualizar el servicio", 2500);
    }
  }

  async deleteService(service: Service): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: "Eliminar servicio",
      message: `¿Seguro que deseas eliminar "${service.name}"?`,
      buttons: [
        { text: "Cancelar", role: "cancel" },
        {
          text: "Eliminar",
          role: "destructive",
          handler: async () => {
            await this.servicesProvider.deleteService(service.id);
            await this.alertService.presentToast("Servicio eliminado", 2500);
            await this.loadData();
          },
        },
      ],
    });

    await alert.present();
  }

  private async loadData(): Promise<void> {
    this.isLoading = true;
    this.currentTheme = this.themeService.getCurrentTheme();

    const { start, end } = this.monthRange();

    const [servicesResult, appointmentsResult, clientsResult] = await Promise.all(
      [
        this.servicesProvider.listServices(),
        this.appointmentsProvider.listAppointmentsInRange(start, end),
        this.clientsState.ensureLoaded(),
      ],
    );

    this.services = servicesResult.documents;
    this.appointments = appointmentsResult.documents;
    this.clientsById = new Map(clientsResult.map((client) => [client.id, client]));

    this.computeMetrics();
    this.renderCharts();
    this.isLoading = false;
  }

  get hasDateFilter(): boolean {
    return this.filterMonth !== ServicesPage.currentMonthStr();
  }

  resetToCurrentMonth(): void {
    this.filterMonth = ServicesPage.currentMonthStr();
    void this.loadData();
  }

  openMonthPicker(): void {
    this.monthPickerValue = `${this.filterMonth}-01`;
    this.isMonthPickerOpen = true;
  }

  cancelMonthPicker(): void {
    this.isMonthPickerOpen = false;
  }

  onMonthPickerDismiss(): void {
    this.isMonthPickerOpen = false;
  }

  confirmMonthPicker(selectedValue: string | null): void {
    this.isMonthPickerOpen = false;
    if (!selectedValue) return;

    const iso = selectedValue.length === 7 ? `${selectedValue}-01` : selectedValue;
    const dt = DateTime.fromISO(iso);
    if (!dt.isValid) return;

    this.filterMonth = dt.toFormat("yyyy-LL");
    void this.loadData();
  }

  private computeMetrics(): void {
    const serviceById = new Map(this.services.map((service) => [service.id, service]));
    const usageByService = new Map<string, number>();
    const rankingByClient = new Map<string, number>();

    this.totalEarned = 0;
    this.totalPending = 0;

    const now = new Date();

    for (const appointment of this.appointments) {
      const serviceId = this.resolveServiceId(appointment, serviceById);
      if (serviceId) {
        usageByService.set(serviceId, (usageByService.get(serviceId) ?? 0) + 1);
      }

      const clientId = this.resolveClientId(appointment);
      if (clientId) {
        rankingByClient.set(clientId, (rankingByClient.get(clientId) ?? 0) + 1);
      }

      const servicePrice = serviceId ? (serviceById.get(serviceId)?.price ?? 0) : 0;
      const appointmentEnd = new Date(appointment.end_time);
      if (appointmentEnd <= now) {
        this.totalEarned += servicePrice;
      } else {
        this.totalPending += servicePrice;
      }
    }

    this.serviceUsage = [...usageByService.entries()]
      .map(([serviceId, count]) => ({
        serviceId,
        name: serviceById.get(serviceId)?.name ?? "Sin servicio",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.clientRanking = [...rankingByClient.entries()]
      .map(([clientId, count]) => ({
        clientName: this.clientsById.get(clientId)?.name ?? "Cliente desconocido",
        clientPhone: this.clientsById.get(clientId)?.phone ?? "",
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    this.totalServices = this.services.length;
    this.topServiceName = this.serviceUsage[0]?.name ?? "—";
    this.topServiceCount = this.serviceUsage[0]?.count ?? 0;
    this.topClientName = this.clientRanking[0]?.clientName ?? "—";
    this.topClientPhone = this.clientRanking[0]?.clientPhone ?? "";
    this.topClientCount = this.clientRanking[0]?.count ?? 0;
  }

  private renderCharts(): void {
    this.destroyCharts();

    const usageCanvas = this.usageChartCanvas?.nativeElement;
    const revenueCanvas = this.revenueChartCanvas?.nativeElement;
    if (!usageCanvas || !revenueCanvas) return;

    this.usageChart = new Chart(usageCanvas, {
      type: "bar",
      data: {
        labels: this.serviceUsage.map((item) => item.name),
        datasets: [
          {
            label: "Usos",
            data: this.serviceUsage.map((item) => item.count),
            backgroundColor: this.serviceUsage.map((item) => {
              const service = this.services.find((s) => s.id === item.serviceId);
              return service?.color ?? this.currentTheme?.primary;
            }),
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
      },
    });

    this.revenueChart = new Chart(revenueCanvas, {
      type: "doughnut",
      data: {
        labels: ["Ganado", "Por ganar"],
        datasets: [
          {
            data: [this.totalEarned, this.totalPending],
            backgroundColor: [this.earnedColor, this.pendingColor],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  private destroyCharts(): void {
    this.usageChart?.destroy();
    this.usageChart = null;
    this.revenueChart?.destroy();
    this.revenueChart = null;
  }

  private resolveServiceId(appointment: Appointment, serviceById: Map<string, Service>): string | null {
    const raw = appointment.services;
    if (!raw) {
      return appointment.service_id && serviceById.has(appointment.service_id)
        ? appointment.service_id
        : null;
    }

    if (Array.isArray(raw)) {
      const first = raw[0];
      if (!first) return null;
      if (typeof first === "string") return first;
      return first.id ?? null;
    }

    if (typeof raw === "string") return raw;
    return raw.id ?? null;
  }

  private resolveClientId(appointment: Appointment): string | null {
    return appointment.client_id ?? null;
  }

  private subscribeToEvents(): void {
    if (this.eventsSubscription) return;

    this.eventsSubscription = this.events
      .getObservable()
      .subscribe((event: { name: string }) => {
        if (event?.name === "add.event") {
          void this.addService();
          return;
        }

        if (event?.name === "appointment.created") {
          void this.loadData();
        }
      });
  }
}
