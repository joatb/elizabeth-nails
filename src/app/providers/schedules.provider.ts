import { Injectable } from "@angular/core";
import { DBService } from "../services/db.service";

@Injectable({
    providedIn: 'root',
})
export class SchedulesProvider {

    private database: string = 'core';
    private collection: string = '67b1bb1d0025dd7894e0';

    constructor(private dbService: DBService) { }
    
    listSchedules() {
        return this.dbService.listDocuments(this.database, this.collection);
    }

    deleteSchedule(clientId: string) {
        return this.dbService.deleteDocument(this.database, this.collection, clientId);
    }
}