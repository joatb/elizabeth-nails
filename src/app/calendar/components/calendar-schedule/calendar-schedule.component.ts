import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { AlertController, IonNav } from '@ionic/angular/standalone';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ICellRendererParams, ModuleRegistry } from 'ag-grid-community';
import { Models } from 'appwrite';
import { localeText } from '../../../../locale/ag-grid.locale';
import { getDayString } from '../../../../shared/date-formatter/date-formatter';
import { SharedModule } from '../../../modules/shared.module';
import { SchedulesProvider } from '../../../providers/schedules.provider';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { CalendarScheduleFormComponent } from '../calendar-schedule-form/calendar-schedule-form.component';

interface CalendarScheduleRowData  {
  id: string;
  schedule: string;
  days: number[];
}

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  template: `
    <div style="display:flex; justify-content: center;" *ngFor="let button of buttons">
      <ion-button [color]="button.color ? button.color : 'primary'" (click)="buttonClicked(button.action)">
        <ion-icon *ngIf="button.icon && !button.label" slot="icon-only" [name]="button.icon"></ion-icon>
        <ion-icon *ngIf="button.icon && button.label" slot="start" [name]="button.icon"></ion-icon>
        {{button.label}}
      </ion-button>
    </div>
  `,
  imports: [SharedModule]
})
export class CustomButtonComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & { buttons: Array<{ label?: string, icon?: string, color?: string, action: string }>, reload: () => void };
  public buttons: Array<{ label?: string, icon?: string, color?: string, action: string }> = [];

  constructor(
    private schedulesPvd: SchedulesProvider,
    private alertCtrl: AlertController
  ) {

  }

  agInit(params: ICellRendererParams & { buttons: Array<{ label?: string, icon?: string, color?: string, action: string }>, reload: () => void }): void {
    this.params = params;
    this.buttons = params.buttons || [];
  }
  refresh(params: ICellRendererParams) {
    return true;
  }
  buttonClicked(action: string) {
    if (action === 'delete') {
      this.delete();
    } else {
      alert(`Clicked: ${this.params.data.name}`);
    }
  }

  async delete(){
    const alert = await this.alertCtrl.create({
        header: 'Eliminar horario',
        message: 'Quieres eliminar este horario?',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel',
            },
            {
                text: 'OK',
                role: 'confirm',
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
  selector: 'app-calendar-schedule',
  templateUrl: 'calendar-schedule.component.html',
  imports: [SharedModule, AgGridAngular],
})
export class CalendarScheduleComponent {

  @Input() nav!: IonNav;
  @ViewChild('agGrid') agGrid!: AgGridAngular;

  rowData: Array<CalendarScheduleRowData> = [];

    // Column Definitions: Defines the columns to be displayed.
    colDefs: ColDef[] = [
      { field: "id", headerName: "id", hide: true },
      { field: "schedule", headerName: "Horario", flex: 1 },
      { field: "days", headerName: "Dias", flex: 2, autoHeight: true},
          { 
            field: "actions", 
            headerName: "", 
            cellRenderer: CustomButtonComponent,
            cellRendererParams: {
              buttons: [
                { icon: 'trash-outline', color: 'danger', action: 'delete' }
              ],
              reload: () => this.reload()
            },
            flex: 1, 
            autoHeight: true },
    ];

  localeText = localeText;

  private schedules: Models.DocumentList<Models.Document> | null = null;

  constructor(
    protected authService: AuthService,
    private schedulesPvd: SchedulesProvider,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {
      
  }

  async ngOnInit(): Promise<void> {

    this.schedules = await this.schedulesPvd.listSchedules();
    this.rowData = [];
    this.schedules.documents.sort((a, b) => new Date(b['$createdAt']).getTime() - new Date(a['$createdAt']).getTime());

    this.schedules.documents.forEach(schedule => {
      this.rowData.push({
        id: schedule['$id'],
        schedule: `${schedule['start_time']} - ${schedule['end_time']}`,
        days: schedule['days'].map((d: string)=>getDayString(Number(d))).join(', ')
      })
    });
    this.cdr.detectChanges(); // Forzar la detección de cambios
  }

  async ionViewDidEnter() {
    this.ngOnInit();
  }


  addSchedule(){
    this.nav.push(CalendarScheduleFormComponent, {nav: this.nav});
  }

  async reload() {
    this.ngOnInit();

    await this.alertService.presentToast("Se ha actualizado la tabla", 2500);
  }
}
