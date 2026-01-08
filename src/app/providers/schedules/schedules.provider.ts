import { Injectable } from "@angular/core";
import { DBService } from "../../services/db.service";
import { Models } from 'appwrite';
import { Schedule } from "./models/schedule";

@Injectable({
    providedIn: 'root',
})
export class SchedulesProvider {

    private database: string = 'core';
    private tableId: string = 'schedules'; // Table ID (migrat de collection a table)

    constructor(private dbService: DBService) { }

    createSchedule(schedule: any) {
        return this.dbService.createDocument(this.database, this.tableId, schedule);
    }
    
    listSchedules(): Promise<Models.DocumentList<Schedule>> {
        return this.dbService.listDocuments<Schedule>(this.database, this.tableId);
    }

    deleteSchedule(scheduleId: string) {
        return this.dbService.deleteDocument(this.database, this.tableId, scheduleId);
    }
}