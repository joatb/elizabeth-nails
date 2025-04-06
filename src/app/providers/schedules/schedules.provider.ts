import { Injectable } from "@angular/core";
import { DBService } from "../../services/db.service";
import { Models } from 'appwrite';
import { Schedule } from "./models/schedule";

@Injectable({
    providedIn: 'root',
})
export class SchedulesProvider {

    private database: string = 'core';
    private collection: string = '67b1bb1d0025dd7894e0';

    constructor(private dbService: DBService) { }

    createSchedule(schedule: any) {
        return this.dbService.createDocument(this.database, this.collection, schedule);
    }
    
    listSchedules(): Promise<Models.DocumentList<Schedule>> {
        return this.dbService.listDocuments<Schedule>(this.database, this.collection);
    }

    deleteSchedule(clientId: string) {
        return this.dbService.deleteDocument(this.database, this.collection, clientId);
    }
}