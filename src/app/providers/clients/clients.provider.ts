import { Injectable } from "@angular/core";
import { Query } from "appwrite";
import { Client } from "./models/client";
import { DBService } from "../../services/db.service";
import { PaginationService, PaginatedResult, PaginationOptions } from "../../services/pagination.service";

@Injectable({
    providedIn: 'root',
})
export class ClientsProvider {

    private database: string = 'core';
    private collection: string = 'clients';

    constructor(
        private dbService: DBService,
        private paginationService: PaginationService
    ) { }
    
    getClient(clientId: string) {
        return this.dbService.getDocument(this.database, this.collection, clientId);
    }
    /**
     * Lista clientes con paginación inteligente
     */
    async listClientsPaginated(limit: number = 50, offset: number = 0): Promise<PaginatedResult<Client>> {
        const options: PaginationOptions = {
            limit,
            offset,
            cacheKey: 'clients_pagination'
        };

        const fetchFunction = async (limit: number, offset: number) => {
            return this.dbService.listDocuments<Client>(
                this.database, 
                this.collection,
                [Query.limit(limit), Query.offset(offset)]
            );
        };

        return this.paginationService.paginateData(fetchFunction, options);
    }

    /**
     * Lista clientes básico (para compatibilidad)
     */
    listClients(limit: number = 50, offset: number = 0) {
        return this.dbService.listDocuments<Client>(
            this.database, 
            this.collection,
            [Query.limit(limit), Query.offset(offset)]
        );
    }

    /**
     * Lista todos los clientes (solo para casos especiales)
     */
    listAllClients() {
        return this.dbService.listDocuments<Client>(this.database, this.collection);
    }

    /**
     * Carga todos los clientes para búsqueda completa
     */
    async loadAllClientsForSearch(): Promise<Client[]> {
        const fetchFunction = async (limit: number, offset: number) => {
            return this.dbService.listDocuments<Client>(
                this.database, 
                this.collection,
                [Query.limit(limit), Query.offset(offset)]
            );
        };

        return this.paginationService.loadAllData(fetchFunction, 'clients_search');
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