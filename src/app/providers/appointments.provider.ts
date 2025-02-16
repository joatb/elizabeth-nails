import { Injectable } from "@angular/core";
import { DBService } from "../services/db.service";

@Injectable({
    providedIn: 'root',
})
export class AppointmentsProvider {

    constructor(private dbService: DBService) { }
    
    listAppointments() {
        return this.dbService.listDocuments('core', 'appointments');
    }

    createAppointment(appointment: any) {
        return this.dbService.createDocument('core', 'appointments', appointment);
    }
}