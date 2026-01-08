
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
    private tableId: string = 'clients'; // Table ID (migrat de collection a table)

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
     * Lista clientes básico (para compatibilidad)
     */
    listClients(limit: number = 50, offset: number = 0, forceRefresh: boolean = false) {
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
     * Lista todos los clientes (solo para casos especiales)
     */
    listAllClients() {
        return this.dbService.listDocuments<Client>(
            this.database,
            this.tableId,
            [Query.select(['*', 'appointments.*'])]
        );
    }

    /**
     * Carga todos los clientes para búsqueda completa
     */
    async loadAllClientsForSearch(): Promise<Client[]> {
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

        return this.paginationService.loadAllData(fetchFunction, 'clients_search');
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
     * Busca clientes por nombre - SIN CACHÉ
     * Usa DBService con forceRefresh: true para evitar el caché
     */
    async searchClientsByName(searchTerm: string, limit: number = 50): Promise<Client[]> {
        if (!searchTerm || searchTerm.trim().length === 0) {
            return [];
        }

        try {
            // Usar DBService con forceRefresh: true para evitar el caché
            const result = await this.dbService.listDocuments<Client>(
                this.database,
                this.tableId,
                [
                    Query.select(['*', 'appointments.*']),
                    Query.search('name', searchTerm),
                    Query.limit(limit)
                ],
                true // forceRefresh: true para evitar caché
            );

            return result.documents;
        } catch (error) {
            console.error('Error searching clients by name:', error);
            return [];
        }
    }

}
