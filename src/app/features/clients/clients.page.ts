import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from "@angular/core";
import { AlertController, ModalController } from "@ionic/angular/standalone";
import { AgGridAngular, ICellRendererAngularComp } from "ag-grid-angular"; // Angular Data Grid Component
import type { ColDef, ICellRendererParams } from "ag-grid-community"; // Column Definition Type Interface
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { LogOut } from "lucide-angular";
import { DateTime } from "luxon";
import { Subscription } from "rxjs";
import { localeText } from "../../../locale/ag-grid.locale";
import { dateFormatter } from "../../../shared/date-formatter/date-formatter";
import { SharedModule } from "../../modules/shared.module";
import { Appointment } from "../../providers/appointments/models/appointment";
import { ClientsProvider } from "../../providers/clients/clients.provider";
import { Client } from "../../providers/clients/models/client";
import { AlertService } from "../../services/alert.service";
import { AuthService } from "../../services/auth.service";
import { EventService } from "../../services/event.service";
import {
  ClientsToolbarComponent,
  ClientsGridPanelComponent,
  ClientFormPage,
  MolLoadingBannerComponent,
  MolPaginationInfoComponent,
} from "../../ui";

interface ClientsRowData extends Record<string, unknown> {
  id: string;
  name: string;
  phone: string;
  phone_country: string;
  next_appointment: string;
  appointments: number;
  tsinsert: string;
}

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  templateUrl: "./clients-custom-button.component.html",
  styleUrls: ["./clients-custom-button.component.scss"],
  imports: [SharedModule],
})
class CustomButtonComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & {
    buttons: Array<{
      label?: string;
      icon?: string;
      color?: string;
      action: string;
    }>;
    reload: () => void;
  };
  public buttons: Array<{
    label?: string;
    icon?: string;
    color?: string;
    action: string;
  }> = [];

  constructor(
    private clientsProvider: ClientsProvider,
    private alertCtrl: AlertController,
    private alertService: AlertService,
  ) {}

  agInit(
    params: ICellRendererParams & {
      buttons: Array<{
        label?: string;
        icon?: string;
        color?: string;
        action: string;
      }>;
      reload: () => void;
    },
  ): void {
    this.params = params;
    this.buttons = params.buttons || [];
  }
  refresh(params: ICellRendererParams) {
    return true;
  }
  buttonClicked(action: string) {
    if (action === "delete") {
      this.delete();
    } else {
      alert(`Clicked: ${this.params.data.name}`);
    }
  }

  async delete() {
    const alert = await this.alertCtrl.create({
      header: "Eliminar cliente",
      message: "¿Estás seguro de que quieres eliminar este cliente?",
      cssClass: "custom-alert",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "alert-button-cancel",
        },
        {
          text: "Eliminar",
          role: "destructive",
          cssClass: "alert-button-confirm",
          handler: async () => {
            try {
              await this.clientsProvider.deleteClient(this.params.data.id);
              await this.alertService.presentToast(
                "Cliente eliminado correctamente",
                2500,
              );
              this.params.reload();
            } catch (error) {
              await this.alertService.presentErrorToast(
                "Error al eliminar el cliente",
                2500,
              );
            }
          },
        },
      ],
    });

    await alert.present();
  }
}

@Component({
  selector: "app-clients",
  templateUrl: "clients.page.html",
  styleUrls: ["clients.page.scss"],
  imports: [SharedModule, ClientsToolbarComponent, ClientsGridPanelComponent],
})
export class ClientsPage {
  readonly LogOut = LogOut;

  private gridApi: any;
  @ViewChild("agGrid", { read: ElementRef }) agGridElement!: ElementRef;

  // Row Data: The data to be displayed.
  rowData: Array<ClientsRowData> = [];

  // Paginación
  currentOffset = 0;
  private readonly pageSize = 50;
  totalClients = 0;
  isLoadingMore = false;
  allClientsLoaded = false;
  isLoadingAll = false;
  hasMoreClients = false;

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: "id", headerName: "id", hide: true },
    {
      field: "name",
      headerName: "Cliente",
      flex: 2,
      minWidth: 150,
      filter: "agTextColumnFilter",
      editable: true,
      onCellValueChanged: (cellValueChangedEvt) =>
        this.editClient(cellValueChangedEvt),
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "phone_country",
      headerName: "Prefijo",
      flex: 1,
      minWidth: 100,
      autoHeight: true,
      editable: true,
      onCellValueChanged: (cellValueChangedEvt) =>
        this.editClient(cellValueChangedEvt),
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "phone",
      headerName: "Teléfono",
      flex: 1,
      minWidth: 120,
      autoHeight: true,
      editable: true,
      onCellValueChanged: (cellValueChangedEvt) =>
        this.editClient(cellValueChangedEvt),
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "next_appointment",
      headerName: "Próxima Cita",
      flex: 1,
      minWidth: 150,
      autoHeight: true,
      valueFormatter: dateFormatter,
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "tsinsert",
      headerName: "Fecha de alta",
      flex: 1,
      minWidth: 150,
      autoHeight: true,
      valueFormatter: dateFormatter,
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "appointments",
      headerName: "Total de citas",
      flex: 1,
      minWidth: 120,
      autoHeight: true,
      cellStyle: { display: "flex", alignItems: "center" },
    },
    {
      field: "actions",
      headerName: "",
      cellRenderer: CustomButtonComponent,
      cellRendererParams: {
        buttons: [{ icon: "trash-outline", color: "danger", action: "delete" }],
        reload: () => this.reload(),
      },
      flex: 1,
      minWidth: 100,
      autoHeight: true,
      cellStyle: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      },
    },
  ];

  localeText = localeText;

  private clients: { total: number; documents: Client[] } | null = null;

  private eventsSubscription: Subscription | null = null;

  constructor(
    protected authService: AuthService,
    private clientsProvider: ClientsProvider,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private events: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ionViewDidEnter() {
    this.subscribeToEvents();
    // Verificar si hi ha filtres actius a ag-Grid abans de carregar
    await this.checkAndInitializeClients();
  }

  private async checkAndInitializeClients() {
    // Carregar els clients inicialment
    await this.initializeClients();

    // Després de carregar, verificar si hi ha filtres actius a ag-Grid
    // Esperar una mica perquè el grid s'actualitzi
    setTimeout(() => {
      this.checkForActiveFilters();
    }, 300);
  }

  onGridReady(event: any) {
    this.gridApi = event?.api;
    // Configurar listener para detectar cuando se activa la búsqueda
    if (event?.api && typeof event.api.addEventListener === "function") {
      event.api.addEventListener("filterChanged", () => {
        this.onFilterChanged();
      });

      // Configurar listener para detectar cuando se ordena
      event.api.addEventListener("sortChanged", () => {
        this.onFilterChanged();
      });
    }

    // Verificar si hi ha filtres actius quan el grid està llest
    setTimeout(() => {
      this.checkForActiveFilters();
    }, 200);
  }

  private async checkForActiveFilters() {
    if (!this.gridApi) return;

    const filterModel = this.gridApi?.getFilterModel();
    const hasActiveFilters = filterModel && Object.keys(filterModel).length > 0;

    // Si hi ha filtres actius i no tenim tots els clients carregats, carregar-los
    if (hasActiveFilters && !this.allClientsLoaded && !this.isLoadingAll) {
      await this.loadAllClients();
    }
  }

  private async onFilterChanged() {
    // Verificar si hay algún filtro activo (texto, número, fecha, etc.)
    const filterModel = this.gridApi?.getFilterModel();
    const hasActiveFilters = filterModel && Object.keys(filterModel).length > 0;

    // Verificar si hay algún ordenamiento activo
    const columnState = this.gridApi?.getColumnState();
    const hasActiveSorting =
      columnState &&
      columnState.some((col: { sort: string | null }) => col.sort !== null);

    // Cargar todos los clientes si hay filtros o ordenamiento activo
    if (
      (hasActiveFilters || hasActiveSorting) &&
      !this.allClientsLoaded &&
      !this.isLoadingAll
    ) {
      await this.loadAllClients();
    }
  }
  ionViewDidLeave() {
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async initializeClients(resetAllClientsLoaded: boolean = true) {
    try {
      // Reset paginación
      this.currentOffset = 0;
      this.rowData = [];

      // Si s'ha de resetejar l'estat de "tots carregats"
      if (resetAllClientsLoaded) {
        this.allClientsLoaded = false;
      }

      // Usar paginación inteligente - cargar solo 50 clientes inicialmente
      const paginatedResult = await this.clientsProvider.listClientsPaginated(
        this.pageSize,
        this.currentOffset,
      );

      this.totalClients = Math.max(paginatedResult.total, paginatedResult.documents.length);
      this.currentOffset = paginatedResult.documents.length;
      this.hasMoreClients = paginatedResult.hasMore;

      paginatedResult.documents.forEach((client: Client) => {
        this.rowData.push(this.mapClientToRowData(client));
      });

      this.gridApi?.setGridOption("rowData", this.rowData);
      this.cdr.detectChanges(); // Forzar la detección de cambios
    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      // Fallback al método original si hay error
      this.clients = await this.clientsProvider.listClients();
      this.rowData = [];
      this.clients?.documents.forEach((client: Client) => {
        this.rowData.push(this.mapClientToRowData(client));
      });
      this.totalClients = Math.max(this.totalClients, this.rowData.length);
      this.currentOffset = this.rowData.length;
      this.hasMoreClients = false;
      this.gridApi?.setGridOption("rowData", this.rowData);
      this.cdr.detectChanges();
    }
  }

  private mapClientToRowData(client: Client): ClientsRowData {
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      phone_country: client.phone_country,
      next_appointment:
        (client.appointments ?? []).length > 0
          ? (client.appointments ?? []).sort(
              (a: Appointment, b: Appointment) =>
                DateTime.fromISO(b.start_time).toMillis() -
                DateTime.fromISO(a.start_time).toMillis(),
            )[0].start_time
          : "No hay citas",
      appointments: (client.appointments ?? []).length,
      tsinsert: client["created_at"],
    };
  }

  async loadMoreClients() {
    if (this.isLoadingMore || !this.hasMoreClients) return;

    this.isLoadingMore = true;

    try {
      const paginatedResult = await this.clientsProvider.listClientsPaginated(
        this.pageSize,
        this.currentOffset,
      );

      // Agregar nuevos clientes a la lista existente
      paginatedResult.documents.forEach((client: Client) => {
        this.rowData.push(this.mapClientToRowData(client));
      });

      this.currentOffset += paginatedResult.documents.length;
      this.totalClients = Math.max(paginatedResult.total, this.rowData.length);
      this.hasMoreClients = paginatedResult.hasMore;

      // Actualizar la grilla
      this.gridApi?.setGridOption("rowData", this.rowData);
      this.cdr.detectChanges();
    } catch (error) {
      console.error("❌ Error cargando más clientes:", error);
    } finally {
      this.isLoadingMore = false;
    }
  }

  async loadAllClients() {
    if (this.isLoadingAll || this.allClientsLoaded) return;

    this.isLoadingAll = true;

    try {
      const allClients = await this.clientsProvider.loadClientsForGrid();

      // Reemplazar todos los datos
      this.rowData = [];
      allClients.forEach((client: Client) => {
        this.rowData.push(this.mapClientToRowData(client));
      });

      this.allClientsLoaded = true;
      this.currentOffset = allClients.length;
      this.totalClients = allClients.length;
      this.hasMoreClients = false;

      // Actualizar la grilla
      this.gridApi?.setGridOption("rowData", this.rowData);
      this.cdr.detectChanges();

      // Mostrar mensaje informativo
      await this.alertService.presentToast(
        "Todos los clientes cargados. Filtros y ordenamiento completos disponibles.",
        3000,
      );
    } catch (error) {
      console.error("❌ Error cargando todos los clientes:", error);
      await this.alertService.presentToast(
        "Error cargando todos los clientes",
        3000,
      );
    } finally {
      this.isLoadingAll = false;
    }
  }

  async addClient() {
    const modal = await this.modalCtrl.create({
      component: ClientFormPage,
      componentProps: {
        title: "Nuevo Cliente",
        client: null,
      },
    });

    await modal.present();

    modal.onDidDismiss().then(async (event) => {
      if (event.data) {
        await this.clientsProvider.createClient(event.data);
        this.reload();
      }
    });
  }

  async editClient(event: any) {
    try {
      await this.clientsProvider.updateClient(event.data.id, {
        name: event.data.name,
        phone: event.data.phone,
        phone_country: event.data.phone_country,
      });
      await this.alertService.presentToast("Cliente actualizado", 2500);
    } catch (error) {
      try {
        if (event?.api && typeof event.api.undoCellEditing === "function") {
          event.api.undoCellEditing();
        }
      } catch {
        // noop - proteger contra errores al intentar deshacer edición en la celda
      }
      await this.alertService.presentToast(
        "Error al actualizar el cliente",
        2500,
      );
    }
  }

  async reload() {
    this.initializeClients();
    await this.alertService.presentToast("Se ha actualizado la tabla", 2500);
  }

  async subscribeToEvents() {
    this.eventsSubscription = this.events
      .getObservable()
      .subscribe(async (event: { name: string }) => {
        if (event.name === "add.event") {
          this.addClient();
        }
      });
  }
}
