import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular'; // Angular Data Grid Component
import type { ColDef, ICellRendererParams } from 'ag-grid-community'; // Column Definition Type Interface
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { Models } from 'appwrite';
import { LogOut } from 'lucide-angular';
import { DateTime } from 'luxon';
import { Subscription } from 'rxjs';
import { localeText } from '../../locale/ag-grid.locale';
import { dateFormatter } from '../../shared/date-formatter/date-formatter';
import { SharedModule } from '../modules/shared.module';
import { Appointment } from '../providers/appointments/models/appointment';
import { ClientsProvider } from '../providers/clients/clients.provider';
import { Client } from '../providers/clients/models/client';
import { AlertService } from '../services/alert.service';
import { AuthService } from '../services/auth.service';
import { EventService } from '../services/event.service';
import { ClientFormPage } from './components/client-form/client-form-page';

interface ClientsRowData  {
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
  template: `
    <div class="action-buttons">
      <ion-fab-button *ngFor="let button of buttons" 
        [color]="button.color ? button.color : 'primary'" 
        (click)="buttonClicked(button.action)"
        size="small">
        <ion-icon [name]="button.icon"></ion-icon>
      </ion-fab-button>
    </div>
  `,
  styles: [`
    .action-buttons {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
  `],
  imports: [SharedModule]
})
class CustomButtonComponent implements ICellRendererAngularComp {
  private params!: ICellRendererParams & { buttons: Array<{ label?: string, icon?: string, color?: string, action: string }>, reload: () => void };
  public buttons: Array<{ label?: string, icon?: string, color?: string, action: string }> = [];

  constructor(
    private clientsProvider: ClientsProvider,
    private alertCtrl: AlertController,
    private alertService: AlertService
  ) {}

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
      message: '¿Estás seguro de que quieres eliminar este cliente?',
      cssClass: 'custom-alert',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'alert-button-confirm',
          handler: async () => {
            try {
              await this.clientsProvider.deleteClient(this.params.data.id);
              await this.alertService.presentToast('Cliente eliminado correctamente', 2500);
              this.params.reload();
            } catch (error) {
              await this.alertService.presentErrorToast('Error al eliminar el cliente', 2500);
            }
          }
        }
      ]
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
export class ClientsPage {

  readonly LogOut =  LogOut;

  @ViewChild('agGrid') agGrid!: AgGridAngular;

  // Row Data: The data to be displayed.
  rowData: Array<ClientsRowData> = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: "id", headerName: "id", hide: true },
    { 
      field: "name", 
      headerName: "Cliente", 
      flex: 2, 
      minWidth: 150,
      filter: 'agTextColumnFilter', 
      editable: true, 
      onCellValueChanged: (cellValueChangedEvt)=> this.editClient(cellValueChangedEvt), 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "phone_country", 
      headerName: "Prefijo", 
      flex: 1, 
      minWidth: 100,
      autoHeight: true, 
      editable: true, 
      onCellValueChanged: (cellValueChangedEvt)=> this.editClient(cellValueChangedEvt), 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "phone", 
      headerName: "Teléfono", 
      flex: 1, 
      minWidth: 120,
      autoHeight: true, 
      editable: true, 
      onCellValueChanged: (cellValueChangedEvt)=> this.editClient(cellValueChangedEvt), 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "next_appointment", 
      headerName: "Próxima Cita", 
      flex: 1, 
      minWidth: 150,
      autoHeight: true, 
      valueFormatter: dateFormatter, 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "tsinsert", 
      headerName: "Fecha de alta", 
      flex: 1, 
      minWidth: 150,
      autoHeight: true, 
      valueFormatter: dateFormatter, 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
    { 
      field: "appointments", 
      headerName: "Total de citas", 
      flex: 1, 
      minWidth: 120,
      autoHeight: true, 
      cellStyle: { display: 'flex', alignItems: 'center' } 
    },
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
      minWidth: 100,
      autoHeight: true,
      cellStyle: { display: 'flex', alignItems: 'center', justifyContent: 'center' }
    },
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

  async ionViewDidEnter(){
    this.subscribeToEvents();
    this.initializeClients();
  }
  ionViewDidLeave(){
    this.eventsSubscription?.unsubscribe();
    this.eventsSubscription = null;
  }

  async initializeClients(){
    this.clients = await this.clientsProvider.listClients();
    this.rowData = [];

    this.clients?.documents.forEach(client => {
      this.rowData.push({
        id: client.$id,
        name: client.name,
        phone: client.phone,
        phone_country: client.phone_country,
        next_appointment: client.appointments.length > 0 ? client.appointments.sort((a: Appointment, b: Appointment) => DateTime.fromISO(b.start_time).toMillis() - DateTime.fromISO(a.start_time).toMillis())[0].start_time : 'No hay citas',
        appointments: client.appointments.length,
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
      await this.clientsProvider.updateClient(event.data.id, {
        name: event.data.name,
        phone: event.data.phone,
        phone_country: event.data.phone_country
      });
      await this.alertService.presentToast('Cliente actualizado', 2500);
    } catch (error) {
      event.api.undoCellEditing();
      await this.alertService.presentToast('Error al actualizar el cliente', 2500);
    }
  }

  async reload() {
    this.initializeClients();
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
