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

    createDocument(databaseId: string, collectionId: string, data: any) {
        return this.databases.createDocument(databaseId, collectionId, ID.unique(), data);
    }

    getDocument(databaseId: string, collectionId: string, documentId: string) {
        return this.databases.getDocument(databaseId, collectionId, documentId);
    }

    listDocuments<T extends Models.Document>(databaseId: string, collectionId: string, queries?: string[]): Promise<Models.DocumentList<T>> {
        queries = queries || [Query.limit(this.limit)];
        return this.databases.listDocuments(databaseId, collectionId, queries) as Promise<Models.DocumentList<T>>;
    }

    updateDocument(databaseId: string, collectionId: string, documentId: string, data: any) {
        return this.databases.updateDocument(databaseId, collectionId, documentId, data);
    }

    deleteDocument(databaseId: string, collectionId: string, documentId: string) {
        return this.databases.deleteDocument(databaseId, collectionId, documentId);
    }
}