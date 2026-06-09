
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
    private tableId: string = 'clients';

    constructor(
        private dbService: DBService,
        private paginationService: PaginationService
    ) { }

    getClient(clientId: string) {
        return this.dbService.getDocument(this.database, this.tableId, clientId, [
            Query.select(['*', 'appointments.*'])
        ]);
    }

    /**
     * Lista clientes paginados con appointments expandidos (para la grid de clientes).
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
                this.tableId,
                [
                    Query.select(['*', 'appointments.*']),
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
        };

        return this.paginationService.paginateData(fetchFunction, options);
    }

    /**
     * Lista clientes básico (para compatibilidad).
     */
    listClients(limit: number = 50, offset: number = 0) {
        return this.dbService.listDocuments<Client>(
            this.database,
            this.tableId,
            [
                Query.select(['*', 'appointments.*']),
                Query.limit(limit),
                Query.offset(offset)
            ]
        );
    }

    /**
     * Lista todos los clientes con appointments expandidos (para grid completa).
     */
    listAllClients() {
        return this.dbService.listDocuments<Client>(
            this.database,
            this.tableId,
            [Query.select(['*', 'appointments.*'])]
        );
    }

    /**
     * Carga todos los clientes con campos mínimos para búsqueda/chat/analytics.
     * No expande appointments para reducir lecturas.
     */
    async loadAllClientsForSearch(): Promise<Client[]> {
        const fetchFunction = async (limit: number, offset: number) => {
            return this.dbService.listDocuments<Client>(
                this.database,
                this.tableId,
                [
                    Query.select(['$id', 'name', 'phone', 'phone_country']),
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
        };

        return this.paginationService.loadAllData(fetchFunction, 'clients_search');
    }

    /**
     * Carga todos los clientes con appointments para la grid de clientes.
     */
    async loadClientsForGrid(): Promise<Client[]> {
        const fetchFunction = async (limit: number, offset: number) => {
            return this.dbService.listDocuments<Client>(
                this.database,
                this.tableId,
                [
                    Query.select(['*', 'appointments.*']),
                    Query.limit(limit),
                    Query.offset(offset)
                ]
            );
        };

        return this.paginationService.loadAllData(fetchFunction, 'clients_grid');
    }

    createClient(client: any) {
        return this.dbService.createDocument(this.database, this.tableId, client);
    }

    updateClient(clientId: string, client: any) {
        return this.dbService.updateDocument(this.database, this.tableId, clientId, client);
    }

    deleteClient(clientId: string) {
        return this.dbService.deleteDocument(this.database, this.tableId, clientId);
    }

    /**
     * Busca clientes por nombre usando caché.
     */
    async searchClientsByName(searchTerm: string, limit: number = 50): Promise<Client[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        try {
            const result = await this.dbService.listDocuments<Client>(
                this.database,
                this.tableId,
                [
                    Query.select(['$id', 'name', 'phone', 'phone_country']),
                    Query.search('name', searchTerm),
                    Query.limit(limit)
                ]
            );

            return result.documents;
        } catch (error) {
            console.error('Error searching clients by name:', error);
            return [];
        }
    }

}
