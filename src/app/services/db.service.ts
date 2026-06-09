import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { Client, TablesDB, ID, Query } from "appwrite";
import { environment } from "../../environments/environment";
import { Models } from 'appwrite';

@Injectable({
    providedIn: 'root',
})
export class DBService {
    private client: Client;
    private tablesDB: TablesDB;
    private limit: number = 2500;

    // L1 in-memory cache: evita round trips a Appwrite entre navegaciones
    private memoryCache = new Map<string, { data: any; expiresAt: number }>();

    // TTL en segundos por tabla
    private ttlByTable: Record<string, number> = {
        clients: 86400,       // 24h
        appointments: 1800,   // 30min
        messages: 300,        // 5min
        schedules: 86400,     // 24h
        services: 86400       // 24h
    };

    constructor(
        private router: Router,
        private alertCtrl: AlertController,
    ) {
        this.client = new Client()
            .setEndpoint(environment.endpoint)
            .setProject("elizabeth-nails");

        this.tablesDB = new TablesDB(this.client);
    }

    private buildCacheKey(databaseId: string, tableId: string, queries: string[]): string {
        return `${databaseId}_${tableId}_${btoa(JSON.stringify(queries))}`;
    }

    private getFromMemoryCache<T>(key: string): T | null {
        const entry = this.memoryCache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }
        return entry.data as T;
    }

    private setToMemoryCache(key: string, data: any, ttlSeconds: number): void {
        this.memoryCache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000
        });
    }

    private clearListCache(databaseId: string, tableId: string): void {
        const prefix = `${databaseId}_${tableId}_`;
        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix)) {
                this.memoryCache.delete(key);
            }
        }
    }

    async createDocument(databaseId: string, tableId: string, data: any) {
        const result = await this.tablesDB.createRow({
            databaseId,
            tableId,
            rowId: ID.unique(),
            data
        });
        this.clearListCache(databaseId, tableId);
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

    async listDocuments<T extends Models.Document>(
        databaseId: string,
        tableId: string,
        queries?: string[],
        forceRefresh: boolean = false,
        cacheMinutes: number = 1440
    ): Promise<Models.DocumentList<T>> {
        queries = queries || [Query.limit(this.limit)];
        const cacheKey = this.buildCacheKey(databaseId, tableId, queries);
        const ttlSeconds = this.ttlByTable[tableId] ?? (cacheMinutes * 60);

        if (!forceRefresh) {
            const cached = this.getFromMemoryCache<Models.DocumentList<T>>(cacheKey);
            if (cached) return cached;
        }

        const rowList = await this.tablesDB.listRows({
            databaseId,
            tableId,
            queries
        });

        const data: Models.DocumentList<T> = {
            total: rowList.total,
            documents: rowList.rows as unknown as T[]
        } as Models.DocumentList<T>;

        if (!forceRefresh) {
            this.setToMemoryCache(cacheKey, data, ttlSeconds);
        }

        return data;
    }

    async updateDocument(databaseId: string, tableId: string, rowId: string, data: any) {
        const result = await this.tablesDB.updateRow({
            databaseId,
            tableId,
            rowId,
            data
        });
        this.clearListCache(databaseId, tableId);
        return result;
    }

    async deleteDocument(databaseId: string, tableId: string, rowId: string) {
        const result = await this.tablesDB.deleteRow({
            databaseId,
            tableId,
            rowId
        });
        this.clearListCache(databaseId, tableId);
        return result;
    }

    async clearCacheForCollection(databaseId: string, tableId: string) {
        this.clearListCache(databaseId, tableId);
    }

    async clearAllCache() {
        this.memoryCache.clear();
    }
}
