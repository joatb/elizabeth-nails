import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
import { AlertController, IonNav } from "@ionic/angular/standalone";
import { AgGridAngular, ICellRendererAngularComp } from "ag-grid-angular";
import {
  AllCommunityModule,
  ColDef,
  ICellRendererParams,
  ModuleRegistry,
} from "ag-grid-community";
import { Models } from "appwrite";
import { localeText } from "../../../../locale/ag-grid.locale";
import { getDayString } from "../../../../shared/date-formatter/date-formatter";
import { SharedModule } from "../../../modules/shared.module";
import { SchedulesProvider } from "../../../providers/schedules/schedules.provider";
import { AuthService } from "../../../services/auth.service";
import { AlertService } from "../../../services/alert.service";
import { CalendarScheduleFormComponent } from "../schedule-form/calendar-schedule-form.component";
import { Schedule } from "../../../providers/schedules/models/schedule";

interface CalendarScheduleRowData {
  id: string;
  schedule: string;
  days: string;
}

type CustomButtonConfig = {
  label?: string;
  icon?: string;
  color?: string;
  action: string;
};

type CustomButtonParams = {
  buttons: CustomButtonConfig[];
  reload: () => void;
};

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  templateUrl: "./custom-button.component.html",
  imports: [SharedModule],
})
export class CustomButtonComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & CustomButtonParams;
  public buttons: CustomButtonConfig[] = [];

  constructor(
    private schedulesPvd: SchedulesProvider,
    private alertCtrl: AlertController,
  ) {}

  agInit(params: ICellRendererParams & CustomButtonParams): void {
    this.params = params;
    this.buttons = params.buttons || [];
  }
  refresh(params: ICellRendererParams): boolean {
    return true;
  }

  buttonClicked(action: string): void {
    if (action === "delete") {
      this.delete();
    } else {
      alert(`Clicked: ${this.params.data.name}`);
    }
  }

  async delete(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: "Eliminar horario",
      message: "Quieres eliminar este horario?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
        },
        {
          text: "OK",
          role: "confirm",
          handler: async () => {
            await this.schedulesPvd.deleteSchedule(this.params.data.id);
            this.params.reload();
          },
        },
      ],
    });

    await alert.present();
  }
}

@Component({
  selector: "app-calendar-schedule",
  templateUrl: "./calendar-schedule.component.html",
  imports: [SharedModule, AgGridAngular],
})
export class CalendarScheduleComponent {
  @Input() nav!: IonNav;
  @ViewChild("agGrid") agGrid!: AgGridAngular;

  rowData: CalendarScheduleRowData[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: "id", headerName: "id", hide: true },
    { field: "schedule", headerName: "Horario", flex: 1 },
    { field: "days", headerName: "Dias", flex: 2, autoHeight: true },
    {
      field: "actions",
      headerName: "",
      cellRenderer: CustomButtonComponent,
      cellRendererParams: {
        buttons: [{ icon: "trash-outline", color: "danger", action: "delete" }],
        reload: () => this.reload(),
      },
      flex: 1,
      autoHeight: true,
    },
  ];

  localeText = localeText;

  private schedules: Models.DocumentList<Schedule> | null = null;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    this.schedules = await this.schedulesPvd.listSchedules();
    this.rowData = [];
    this.schedules.documents.sort(
      (a, b) =>
        new Date(b["$createdAt"]).getTime() -
        new Date(a["$createdAt"]).getTime(),
    );

    this.schedules.documents.forEach((schedule) => {
      this.rowData.push({
        id: schedule["$id"],
        schedule: `${schedule["start_time"]} - ${schedule["end_time"]}`,
        days: schedule.days
          .map((d: string) => getDayString(Number(d)))
          .join(", "),
      });
    });
    this.cdr.detectChanges(); // Forzar la detección de cambios
  }

  async ionViewDidEnter(): Promise<void> {
    this.ngOnInit();
  }

  addSchedule(): void {
    this.nav.push(CalendarScheduleFormComponent, { nav: this.nav });
  }

  async reload(): Promise<void> {
    this.ngOnInit();

    await this.alertService.presentToast("Se ha actualizado la tabla", 2500);
  }
}
