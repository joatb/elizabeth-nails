import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { Client, Databases, ID, Query } from "appwrite";
import { environment } from "../../environments/environment";
import { Models } from 'appwrite';

@Injectable({
    providedIn: 'root',
})
export class DBService {
    private client: Client;
    private databases: Databases
    private limit: number = 2500;

    constructor(private router: Router, private alertCtrl: AlertController) {
        this.client = new Client()
        .setEndpoint(environment.endpoint)
        .setProject("elizabeth-nails");

        this.databases = new Databases(this.client);
    }

    /**
     * Limpia la caché de listDocuments para una colección específica.
     */
    private clearListCache(databaseId: string, collectionId: string) {
        const prefix = `dbcache_${databaseId}_${collectionId}_`;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
    }

    createDocument(databaseId: string, collectionId: string, data: any) {
        const result = this.databases.createDocument(databaseId, collectionId, ID.unique(), data);
        this.clearListCache(databaseId, collectionId);
        return result;
    }

    getDocument(databaseId: string, collectionId: string, documentId: string) {
        return this.databases.getDocument(databaseId, collectionId, documentId);
    }

    /**
     * Obtiene documentos con caché localStorage (24h por defecto).
     */
    async listDocuments<T extends Models.Document>(
        databaseId: string,
        collectionId: string,
        queries?: string[],
        forceRefresh: boolean = false,
        cacheMinutes: number = 1440 // 24 horas por defecto
    ): Promise<Models.DocumentList<T>> {
        queries = queries || [Query.limit(this.limit)];
        const cacheKey = `dbcache_${databaseId}_${collectionId}_${btoa(JSON.stringify(queries))}`;
        const cacheRaw = localStorage.getItem(cacheKey);
        const now = Date.now();
        if (!forceRefresh && cacheRaw) {
            try {
                const cache = JSON.parse(cacheRaw);
                if (cache.expire > now) {
                    return cache.data;
                }
            } catch {}
        }
        const data = await this.databases.listDocuments(databaseId, collectionId, queries) as Models.DocumentList<T>;
        localStorage.setItem(cacheKey, JSON.stringify({
            expire: now + cacheMinutes * 60 * 1000,
            data
        }));
        return data;
    }

    updateDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
        const result = this.databases.updateDocument(databaseId, collectionId, documentId, data);
        this.clearListCache(databaseId, collectionId);
        return result;
    }

    deleteDocument(databaseId: string, collectionId: string, documentId: string) {
        const result = this.databases.deleteDocument(databaseId, collectionId, documentId);
        this.clearListCache(databaseId, collectionId);
        return result;
    }
}