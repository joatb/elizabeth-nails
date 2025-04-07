import { Injectable } from '@angular/core';
import { DBService } from '../../services/db.service';
import { ChatMessage } from '../../chat/components/chat/models/chat-message';
import { Models } from 'appwrite';
import { Query } from 'appwrite';

@Injectable({
    providedIn: 'root'
})
export class ChatProvider {
    private readonly DATABASE_ID = 'core';
    private readonly COLLECTION_ID = 'messages';

    constructor(private dbService: DBService) {}

    async getMessages(clientId: string) {
        try {
            const response = await this.dbService.listDocuments<ChatMessage>(
                this.DATABASE_ID,
                this.COLLECTION_ID,
                [Query.equal('client', clientId)]
            );

            return response;
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            throw error;
        }
    }

    async sendMessage(message: Omit<ChatMessage, 'timestamp'>) {
        try {
            const newMessage = {
                ...message,
                timestamp: new Date()
            };

            const response = await this.dbService.createDocument(
                this.DATABASE_ID,
                this.COLLECTION_ID,
                newMessage
            );

            return response;
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            throw error;
        }
    }

    async markAsRead(messageId: string): Promise<void> {
        try {
            await this.dbService.updateDocument(
                this.DATABASE_ID,
                this.COLLECTION_ID,
                messageId,
                { read: true }
            );
        } catch (error) {
            console.error('Error al marcar mensaje como leído:', error);
            throw error;
        }
    }

    async markAllAsRead(clientId: string): Promise<void> {
        try {
            const queries = [
                Query.equal('client', clientId),
                Query.equal('read', false)
            ];

            const unreadMessages = await this.dbService.listDocuments<Models.Document>(
                this.DATABASE_ID,
                this.COLLECTION_ID,
                queries
            );

            for (const message of unreadMessages.documents) {
                await this.markAsRead(message.$id);
            }
        } catch (error) {
            console.error('Error al marcar todos los mensajes como leídos:', error);
            throw error;
        }
    }
} 