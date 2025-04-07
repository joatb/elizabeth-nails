import { Injectable } from "@angular/core";
import { Client } from "./models/client";
import { DBService } from "../../services/db.service";

@Injectable({
    providedIn: 'root',
})
export class ClientsProvider {

    private database: string = 'core';
    private collection: string = 'clients';

    constructor(private dbService: DBService) { }
    
    getClient(clientId: string) {
        return this.dbService.getDocument(this.database, this.collection, clientId);
    }
    listClients() {
        return this.dbService.listDocuments<Client>(this.database, this.collection);
    }

    createClient(client: any) {
        return this.dbService.createDocument(this.database, this.collection, client);
    }

    updateClient(clientId: string, client: any) {
        return this.dbService.updateDocument(this.database, this.collection, clientId, client);
    }

    deleteClient(clientId: string) {
        return this.dbService.deleteDocument(this.database, this.collection, clientId);
    }
}