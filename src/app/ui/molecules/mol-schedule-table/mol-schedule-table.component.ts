import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ChangeDetectorRef } from "@angular/core";
import { AgGridAngular } from "ag-grid-angular";
import { ColDef, ModuleRegistry, AllCommunityModule, GridReadyEvent } from "ag-grid-community";
import { Models } from "appwrite";

import { AtomSpinnerComponent } from "../../atoms/atom-spinner/atom-spinner.component";
import { MolFabButtonComponent } from "../mol-fab-button/mol-fab-button.component";
import { MolCustomButtonComponent } from "../mol-custom-button/mol-custom-button.component";
// Renderer específico usado por la tabla (wrapper para los botones de acción)
import { CustomButtonRendererComponent } from "../../organisms/calendar-schedule-grid/custom-button-renderer.component";

import { SchedulesProvider } from "../../../providers/schedules/schedules.provider";
import { Schedule } from "../../../providers/schedules/models/schedule";
import { AlertService } from "../../../services/alert.service";

/**
 * Molécula: mol-schedule-table
 *
 * Componente que encapsula la tabla de horarios (AG Grid) y proporciona
 * una API simple para cargar / recargar horarios, añadir y eliminar.
 *
 * Notas:
 * - Tipado estricto en TypeScript.
 * - No introduce nuevas dependencias externas.
 * - Diseñado para ser reutilizable desde un organismo (organism) que actúe
 *   como wrapper de página.
 */

// Registrar módulos de ag-grid (solo la primera vez)
ModuleRegistry.registerModules([AllCommunityModule]);

type RowData = {
  id: string;
  schedule: string;
  days: string;
};

@Component({
  selector: "mol-schedule-table",
  standalone: true,
  template: `
    <div class="mol-schedule-table" style="height:100%; position:relative;">
      <div *ngIf="isLoading" class="mol-schedule-table__loader" style="display:flex; align-items:center; justify-content:center; height:100%;">
        <atom-spinner name="crescent" size="large"></atom-spinner>
      </div>

      <ag-grid-angular
        #agGrid
        *ngIf="!isLoading"
        class="ag-theme-alpine"
        style="width: 100%; height: 100%; display:block;"
        [rowData]="rowData"
        [columnDefs]="colDefs"
        [localeText]="localeText"
        [components]="components"
        (gridReady)="onGridReady($event)"
      ></ag-grid-angular>

      <!-- FAB para añadir nuevos horarios -->
      <mol-fab-button
        icon="add-outline"
        (main)="handleAddSchedule()"
        style="position:absolute; bottom:16px; right:16px;"
      ></mol-fab-button>
    </div>
  `,
  imports: [
    CommonModule,
    AgGridAngular,
    AtomSpinnerComponent,
    MolFabButtonComponent,
  ],
})
export class MolScheduleTableComponent implements OnInit {
  @Input() pageSize: number = 50;
  @Input() localeText: Record<string, string> = {};

  @Output() addSchedule = new EventEmitter<void>();
  @Output() scheduleDeleted = new EventEmitter<string>();
  @Output() loaded = new EventEmitter<RowData[]>();

  public rowData: RowData[] = [];
  public isLoading: boolean = true;

  public components: Record<string, unknown> = {
    customButtonRenderer: CustomButtonRendererComponent,
  };

  public colDefs: ColDef[] = [
    { field: "id", headerName: "ID", hide: true },
    { field: "schedule", headerName: "Horario", flex: 1 },
    { field: "days", headerName: "Días", flex: 2, autoHeight: true },
    {
      field: "actions",
      headerName: "",
      cellRenderer: "customButtonRenderer",
      cellRendererParams: {
        buttons: [{ icon: "trash-outline", color: "danger", action: "delete" }],
        // reload será provisto en tiempo de ejecución por la instancia
      },
      flex: 1,
      autoHeight: true,
    },
  ];

  private schedules: Models.DocumentList<Schedule> | null = null;

  constructor(
    private schedulesPvd: SchedulesProvider,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {}

  public async ngOnInit(): Promise<void> {
    await this.loadSchedules();
  }

  /**
   * Cargar horarios desde el provider y mapear a la forma que necesita la tabla.
   */
  public async loadSchedules(): Promise<void> {
    this.isLoading = true;
    try {
      this.schedules = await this.schedulesPvd.listSchedules();
      const docs = this.schedules?.documents ?? [];
      // Ordenar por fecha de creación (descendente)
      docs.sort((a, b) =>
        new Date(b["$createdAt"]).getTime() - new Date(a["$createdAt"]).getTime(),
      );

      const dayLabels: Record<string, string> = {
        "1": "Lun",
        "2": "Mar",
        "3": "Mie",
        "4": "Jue",
        "5": "Vie",
        "6": "Sab",
        "7": "Dom",
      };

      this.rowData = docs.map<RowData>((s) => ({
        id: String(s["$id"]),
        schedule: `${s["start_time"]} - ${s["end_time"]}`,
        days: Array.isArray(s.days)
          ? s.days
              .map((d: string) => dayLabels[String(d)] ?? String(d))
              .join(", ")
          : "",
      }));

      // Actualizar los params de cellRenderer para que puedan llamar a reload()
      // (ag-grid clonará los params, aquí solo aseguramos acceso cuando sea necesario).
      this.colDefs = this.colDefs.map((col) =>
        col.field === "actions"
          ? {
              ...col,
              cellRendererParams: {
                ...(col.cellRendererParams ?? {}),
                reload: () => void this.loadSchedules(),
              },
            }
          : col,
      );

      this.loaded.emit(this.rowData);
    } catch (err) {
      // Manejo mínimo: mostrar toast/alerta y dejar la tabla vacía
      await this.alertService.presentToast("Error cargando horarios", 3000);
      this.rowData = [];
    } finally {
      this.isLoading = false;
      // Forzar detección para que AG Grid vea los cambios en rowData/colDefs
      try {
        this.cdr.detectChanges();
      } catch {
        // noop
      }
    }
  }

  /**
   * Handler público para añadir un horario (emite evento hacia el organismo).
   */
  public handleAddSchedule(): void {
    this.addSchedule.emit();
  }

  /**
   * Intentar eliminar un horario y recargar la tabla.
   * Este método puede ser invocado desde un renderer que emita una acción 'delete'.
   */
  public async deleteSchedule(id: string): Promise<void> {
    if (!id) {
      return;
    }

    try {
      await this.schedulesPvd.deleteSchedule(id);
      this.scheduleDeleted.emit(id);
      await this.loadSchedules();
      await this.alertService.presentToast("Horario eliminado", 2000);
    } catch (err) {
      await this.alertService.presentToast("Error eliminando horario", 2500);
    }
  }

  /**
   * Expuesto para la integración con ag-grid (cuando sea necesario).
   */
  public onGridReady(_event: GridReadyEvent): void {
    // Por ahora no necesitamos lógica adicional cuando el grid está listo,
    // pero el método existe para futuras integraciones (filtrado, API, etc.).
  }
}
