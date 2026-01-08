import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { Client, TablesDB, ID, Query } from "appwrite";
import { environment } from "../../environments/environment";
import { Models } from 'appwrite';
import { AppwriteCacheService } from './appwrite-cache.service';

@Injectable({
    providedIn: 'root',
})
export class DBService {
    private client: Client;
    private tablesDB: TablesDB;
    private limit: number = 2500;
    private totalRowsRead: number = 0;

    constructor(
        private router: Router,
        private alertCtrl: AlertController,
        private appwriteCache: AppwriteCacheService
    ) {
        this.client = new Client()
        .setEndpoint(environment.endpoint)
        .setProject("elizabeth-nails");

        this.tablesDB = new TablesDB(this.client);
        this.setupMonitoring();
    }

    /**
     * Limpia la caché de listRows para una tabla específica.
     */
    private async clearListCache(databaseId: string, tableId: string) {
        // Mapear tablas a tipos de datos para Redis
        const tableToDataType: Record<string, keyof typeof this.appwriteCache['cacheConfigs']> = {
            'clients': 'clients',
            'appointments': 'appointments',
            'messages': 'messages',
            'schedules': 'schedules'
        };

        const dataType = tableToDataType[tableId];
        if (dataType) {
            await this.appwriteCache.invalidate(dataType);
        }

        // Limpiar también localStorage como fallback
        const prefix = `dbcache_${databaseId}_${tableId}_`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    async createDocument(databaseId: string, tableId: string, data: any) {
        const result = await this.tablesDB.createRow({
            databaseId,
            tableId,
            rowId: ID.unique(),
            data
        });
        await this.clearListCache(databaseId, tableId);
        return result;
    }

    getDocument(databaseId: string, tableId: string, rowId: string, queries?: string[]) {
        return this.tablesDB.getRow({
            databaseId,
            tableId,
            rowId,
            queries
        });
    }

    /**
     * Obtiene filas (rows) con caché Redis + localStorage como fallback.
     * Mantiene compatibilidad retornando un objeto similar a DocumentList.
     */
    async listDocuments<T extends Models.Document>(
        databaseId: string,
        tableId: string,
        queries?: string[],
        forceRefresh: boolean = false,
        cacheMinutes: number = 1440 // 24 horas por defecto
    ): Promise<Models.DocumentList<T>> {
        queries = queries || [Query.limit(this.limit)];
        const cacheKey = `${databaseId}_${tableId}_${btoa(JSON.stringify(queries))}`;

        // Mapear tablas a tipos de datos para Redis
        const tableToDataType: Record<string, keyof typeof this.appwriteCache['cacheConfigs']> = {
            'clients': 'clients',
            'appointments': 'appointments',
            'messages': 'messages',
            'schedules': 'schedules'
        };

        const dataType = tableToDataType[tableId] || 'clients';

        if (!forceRefresh) {
            // Intentar obtener de caché a través de Appwrite
            const cachedData = await this.appwriteCache.get<Models.DocumentList<T>>(cacheKey, dataType);
            if (cachedData) {
                return cachedData;
            }
        }

        const rowList = await this.tablesDB.listRows({
            databaseId,
            tableId,
            queries
        });

        // Convertir RowList a DocumentList para mantener compatibilidad
        const data: Models.DocumentList<T> = {
            total: rowList.total,
            documents: rowList.rows as unknown as T[]
        } as Models.DocumentList<T>;

        // Almacenar en caché a través de Appwrite
        await this.appwriteCache.set(cacheKey, data, dataType);

        return data;
    }

    async updateDocument(databaseId: string, tableId: string, rowId: string, data: any) {
        const result = await this.tablesDB.updateRow({
            databaseId,
            tableId,
            rowId,
            data
        });
        await this.clearListCache(databaseId, tableId);
        return result;
    }

    async deleteDocument(databaseId: string, tableId: string, rowId: string) {
        const result = await this.tablesDB.deleteRow({
            databaseId,
            tableId,
            rowId
        });
        await this.clearListCache(databaseId, tableId);
        return result;
    }

    /**
     * Configura el monitoreo de lecturas
     */
    private setupMonitoring() {
        const originalListRows = this.tablesDB.listRows.bind(this.tablesDB);
        this.tablesDB.listRows = async (params: any) => {
            const result = await originalListRows(params);
            this.totalRowsRead += result.rows.length;
            return result;
        };
    }

    /**
     * Obtiene estadísticas de lecturas
     */
    getReadStats() {
        return {
            totalRowsRead: this.totalRowsRead,
            limit: this.limit
        };
    }

    /**
     * Limpia caché específico por tabla
     */
    async clearCacheForCollection(databaseId: string, tableId: string) {
        await this.clearListCache(databaseId, tableId);
    }

    /**
     * Limpia todo el caché
     */
    async clearAllCache() {
        await this.appwriteCache.clear();
    }

    /**
     * Obtiene estadísticas del caché
     */
    async getCacheStats() {
        const redisStats = await this.appwriteCache.getStats();
        const localStorageKeys = this.getLocalStorageKeys();

        return {
            redis: redisStats || { keys: 0 },
            localStorage: { keys: localStorageKeys }
        };
    }

    private getLocalStorageKeys(): number {
        try {
            let count = 0;
            const cacheKeys: string[] = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('cache_') || key.startsWith('appwrite_cache_'))) {
                    count++;
                    cacheKeys.push(key);
                }
            }

            return count;
        } catch (error) {
            console.warn('Error contando claves de localStorage:', error);
            return 0;
        }
    }

    /**
     * Verifica la conexión a Redis
     */
    async pingRedis() {
        return await this.appwriteCache.ping();
    }
}
