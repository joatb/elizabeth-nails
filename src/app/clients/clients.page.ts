import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular'; // Angular Data Grid Component
import type { ColDef, ICellRendererParams } from 'ag-grid-community'; // Column Definition Type Interface
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { SharedModule } from '../modules/shared.module';
import { Models } from 'appwrite';
import { localeText } from '../../locale/ag-grid.locale';
import { dateFormatter } from '../../shared/date-formatter/date-formatter';
import { AlertController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { ClientFormPage } from './components/client-form/client-form-page';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { ClientsProvider } from '../providers/clients/clients.provider';
import { Client } from '../providers/clients/models/client';
import { Appointment } from '../providers/appointments/models/appointment';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';

interface ClientsRowData  {
  id: string;
  name: string;
  next_appointment: string;
  appointments: number;
  last_notification: string;
  tsinsert: string;
}

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  template: `
    <div *ngFor="let button of buttons">
      <ion-button [color]="button.color ? button.color : 'primary'" (click)="buttonClicked(button.action)">
        <ion-icon *ngIf="button.icon && !button.label" slot="icon-only" [name]="button.icon"></ion-icon>
        <ion-icon *ngIf="button.icon && button.label" slot="start" [name]="button.icon"></ion-icon>
        {{button.label}}
      </ion-button>
    </div>
  `,
  imports: [SharedModule]
})
class CustomButtonComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & { buttons: Array<{ label?: string, icon?: string, color?: string, action: string }>, reload: () => void };
  public buttons: Array<{ label?: string, icon?: string, color?: string, action: string }> = [];

  constructor(
    private clientsProvider: ClientsProvider,
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
        header: 'Eliminar cliente',
        message: 'Quieres eliminar este cliente?',
        buttons: [
            {
                text: 'Cancelar',
                role: 'cancel',
            },
            {
                text: 'OK',
                role: 'confirm',
                handler: async () => {
                  await this.clientsProvider.deleteClient(this.params.data.id);
                  this.params.reload();
                },
            },
        ],
    });

    await alert.present();
  }
}

@Component({
  selector: 'app-clients',
  templateUrl: 'clients.page.html',
  styleUrls: ['clients.page.scss'],
  imports: [SharedModule, AgGridAngular]
})
export class ClientsPage implements OnInit{

  @ViewChild('agGrid') agGrid!: AgGridAngular;

  // Row Data: The data to be displayed.
  rowData: Array<ClientsRowData> = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: "id", headerName: "id", hide: true },
    { field: "name", headerName: "Cliente", flex: 2, filter: 'agTextColumnFilter', editable: true, onCellValueChanged: (cellValueChangedEvt)=> this.editClient(cellValueChangedEvt) },
    { field: "next_appointment", headerName: "Próxima Cita", flex: 1, autoHeight: true, valueFormatter: dateFormatter },
    { field: "last_notification", headerName: "Fecha última notificación", flex: 1, autoHeight: true, valueFormatter: dateFormatter },
    { field: "tsinsert", headerName: "Fecha de alta", flex: 1, autoHeight: true, valueFormatter: dateFormatter },
    { field: "appointments", headerName: "Total de citas", flex: 1, autoHeight: true },
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

  private clients: Models.DocumentList<Client> | null = null;

  private eventsSubscription: Subscription | null = null;

  constructor(
    protected authService: AuthService,
    private clientsProvider: ClientsProvider,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private events: EventService,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewDidEnter(){
    this.subscribeToEvents();
  }
  ionViewDidLeave(){
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async ngOnInit(): Promise<void> {
    this.clients = await this.clientsProvider.listClients();
    this.rowData = [];

    this.clients?.documents.forEach(client => {
      this.rowData.push({
        id: client.$id,
        name: client.name,
        next_appointment: client.appointments.length > 0 ? client.appointments.sort((a: Appointment, b: Appointment) => DateTime.fromISO(b.start_time).toMillis() - DateTime.fromISO(a.start_time).toMillis())[0].start_time : 'No hay citas',
        appointments: client.appointments.length,
        last_notification: 'No hay notificaciones',
        tsinsert: client['$createdAt']
      })
    });

    this.agGrid.api?.setGridOption('rowData', this.rowData);
    this.cdr.detectChanges(); // Forzar la detección de cambios
  }

  async addClient() {
    const modal = await this.modalCtrl.create({
      component: ClientFormPage,
      componentProps: {
        title: 'Nuevo Cliente',
        client: null
      }
    });

    await modal.present();

    modal.onDidDismiss().then(async (event) => {
      if(event.data){
        await this.clientsProvider.createClient(event.data);
        this.reload();
      }
    });
  }

  async editClient(event: any) {
    try {
      await this.clientsProvider.updateClient(event.data.id, {name: event.data.name});
      await this.alertService.presentToast('Cliente actualizado', 2500);
    } catch (error) {
      event.api.undoCellEditing();
      await this.alertService.presentToast('Error al actualizar el cliente', 2500);
    }
  }

  async reload() {
    this.ngOnInit();
    await this.alertService.presentToast('Se ha actualizado la tabla', 2500);
  }

  async subscribeToEvents() {
    this.eventsSubscription = this.events.getObservable().subscribe(async (event) => {
      if (event.name === 'add.event') {
        this.addClient();
      }
    });
  }
}
