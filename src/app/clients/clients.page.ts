import { Component } from '@angular/core';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular'; // Angular Data Grid Component
import type { ColDef, ICellRendererParams } from 'ag-grid-community'; // Column Definition Type Interface
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { SharedModule } from '../modules/shared.module';

// Register all community features
ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  standalone: true,
  template: `<ion-button (click)="buttonClicked()">Enviar aviso proxima cita</ion-button>`,
  imports: [SharedModule]
})
export class CustomButtonComponent implements ICellRendererAngularComp {
  agInit(params: ICellRendererParams): void {}
  refresh(params: ICellRendererParams) {
    return true;
  }
  buttonClicked() {
    alert("clicked");
  }
}

@Component({
  selector: 'app-clients',
  templateUrl: 'clients.page.html',
  styleUrls: ['clients.page.scss'],
  imports: [SharedModule, AgGridAngular]
})
export class ClientsPage {

  // Row Data: The data to be displayed.
  rowData = [
    { name: "Isabel Romero", next_appointment: "29/12/2024 (11:00-13:00)", appointments: 10, last_notification: "29/12/2024 09:00:00", tsinsert: "01/01/2024 11:50:00" },
    { name: "Mari Angels", next_appointment: "28/12/2024 (12:00-13:00)", appointments: 5, last_notification: "28/12/2024 09:00:00", tsinsert: "01/01/2024 11:50:00" },
  ];

      // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { field: "name", headerName: "Cliente", flex: 2 },
    { field: "next_appointment", headerName: "Próxima Cita", flex: 1, autoHeight: true },
    { field: "last_notification", headerName: "Fecha última notificación", flex: 1, autoHeight: true },
    { field: "tsinsert", headerName: "Fecha de alta", flex: 1, autoHeight: true },
    { field: "appointments", headerName: "Total de citas", flex: 1, autoHeight: true },
    { field: "Whatsapp", headerName: "", cellRenderer: CustomButtonComponent, flex: 1, autoHeight: true },
  ];

  constructor() {}

}
