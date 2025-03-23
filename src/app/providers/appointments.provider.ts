import { Injectable } from "@angular/core";
import { Query } from "appwrite";
import { DBService } from "../services/db.service";

@Injectable({
    providedIn: 'root',
})
export class AppointmentsProvider {

    constructor(
        private dbService: DBService
    ) { }
    
    listAppointments(month: number, year: number) {
        return this.dbService.listDocuments('core', 'appointments', [
            Query.and([Query.greaterThanEqual('start_time', `${year}-${month}-01 00:00:00`), Query.lessThanEqual('end_time', `${year}-${month}-31 00:00:00`)])
        ]);
    }

    createAppointment(appointment: any) {
        return this.dbService.createDocument('core', 'appointments', appointment);
    }
}