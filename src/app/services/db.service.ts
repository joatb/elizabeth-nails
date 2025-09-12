import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { Client, Databases, ID, Query } from "appwrite";
import { environment } from "../../environments/environment";
import { Models } from 'appwrite';
import { AppwriteCacheService } from './appwrite-cache.service';

@Injectable({
    providedIn: 'root',
})
export class DBService {
    private client: Client;
    private databases: Databases
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

        this.databases = new Databases(this.client);
        this.setupMonitoring();
    }

    /**
     * Limpia la caché de listDocuments para una colección específica.
     */
    private async clearListCache(databaseId: string, collectionId: string) {
        // Mapear colecciones a tipos de datos para Redis
        const collectionToDataType: Record<string, keyof typeof this.appwriteCache['cacheConfigs']> = {
            'clients': 'clients',
            'appointments': 'appointments',
            'messages': 'messages',
            'schedules': 'schedules'
        };

        const dataType = collectionToDataType[collectionId];
        if (dataType) {
            await this.appwriteCache.invalidate(dataType);
        }

        // Limpiar también localStorage como fallback
        const prefix = `dbcache_${databaseId}_${collectionId}_`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    async createDocument(databaseId: string, collectionId: string, data: any) {
        const result = await this.databases.createDocument(databaseId, collectionId, ID.unique(), data);
        await this.clearListCache(databaseId, collectionId);
        return result;
    }

    getDocument(databaseId: string, collectionId: string, documentId: string) {
        return this.databases.getDocument(databaseId, collectionId, documentId);
    }

    /**
     * Obtiene documentos con caché Redis + localStorage como fallback.
     */
    async listDocuments<T extends Models.Document>(
        databaseId: string,
        collectionId: string,
        queries?: string[],
        forceRefresh: boolean = false,
        cacheMinutes: number = 1440 // 24 horas por defecto
    ): Promise<Models.DocumentList<T>> {
        queries = queries || [Query.limit(this.limit)];
        const cacheKey = `${databaseId}_${collectionId}_${btoa(JSON.stringify(queries))}`;
        
        // Mapear colecciones a tipos de datos para Redis
        const collectionToDataType: Record<string, keyof typeof this.appwriteCache['cacheConfigs']> = {
            'clients': 'clients',
            'appointments': 'appointments',
            'messages': 'messages',
            'schedules': 'schedules'
        };

        const dataType = collectionToDataType[collectionId] || 'clients';

        if (!forceRefresh) {
            // Intentar obtener de caché a través de Appwrite
            const cachedData = await this.appwriteCache.get<Models.DocumentList<T>>(cacheKey, dataType);
            if (cachedData) {
                return cachedData;
            }
        }

        const data = await this.databases.listDocuments(databaseId, collectionId, queries) as Models.DocumentList<T>;
        
        // Almacenar en caché a través de Appwrite
        await this.appwriteCache.set(cacheKey, data, dataType);
        
        return data;
    }

    async updateDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
        const result = await this.databases.updateDocument(databaseId, collectionId, documentId, data);
        await this.clearListCache(databaseId, collectionId);
        return result;
    }

    async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
        const result = await this.databases.deleteDocument(databaseId, collectionId, documentId);
        await this.clearListCache(databaseId, collectionId);
        return result;
    }

    /**
     * Configura el monitoreo de lecturas
     */
    private setupMonitoring() {
        const originalListDocuments = this.databases.listDocuments.bind(this.databases);
        this.databases.listDocuments = async <T extends Models.Document>(
            databaseId: string, 
            collectionId: string, 
            queries?: string[]
        ) => {
            const result = await originalListDocuments<T>(databaseId, collectionId, queries);
            this.totalRowsRead += result.documents.length;
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
     * Limpia caché específico por colección
     */
    async clearCacheForCollection(databaseId: string, collectionId: string) {
        await this.clearListCache(databaseId, collectionId);
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