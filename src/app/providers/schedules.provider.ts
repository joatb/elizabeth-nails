import { Injectable } from "@angular/core";
import { DBService } from "../services/db.service";

@Injectable({
    providedIn: 'root',
})
export class SchedulesProvider {

    constructor(private dbService: DBService) { }
    
    listSchedules() {
        return this.dbService.listDocuments('core', '67b1bb1d0025dd7894e0');
    }
}