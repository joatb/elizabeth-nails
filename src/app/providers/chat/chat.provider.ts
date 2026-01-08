import { Injectable } from '@angular/core';
import { DBService } from '../../services/db.service';
import { ChatMessage } from '../../chat/components/chat/models/chat-message';
import { Models } from 'appwrite';
import { Query } from 'appwrite';

export type CreateChatMessage = Pick<ChatMessage, 'content' | 'sent' | 'client' | 'read'>;

@Injectable({
    providedIn: 'root'
})
export class ChatProvider {
    private readonly DATABASE_ID = 'core';
    private readonly TABLE_ID = 'messages'; // Table ID (migrat de collection a table)

    constructor(private dbService: DBService) {}

    /**
     * Obtiene todos los mensajes de un cliente
     */
    async getMessages(clientId: string): Promise<Models.DocumentList<ChatMessage>> {
        try {
            // Cargar todos los mensajes, no solo 25
            const allMessages: ChatMessage[] = [];
            let offset = 0;
            const limit = 100; // Cargar en lotes de 100
            
            while (true) {
                const response = await this.dbService.listDocuments<ChatMessage>(
                    this.DATABASE_ID,
                    this.TABLE_ID,
                    [
                        Query.equal('client', clientId),
                        Query.select(['*', 'client.*']), // Carregar relació del client
                        Query.orderDesc('timestamp'),
                        Query.limit(limit),
                        Query.offset(offset)
                    ]
                );
                
                allMessages.push(...response.documents);
                
                // Si no hay más mensajes, salir
                if (response.documents.length < limit) {
                    break;
                }
                
                offset += limit;
            }
            
            // Ordenar todos los mensajes por timestamp (ascendente para mostrar del más antiguo al más reciente)
            allMessages.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeA - timeB;
            });
            
            // Retornar en formato DocumentList
            return {
                total: allMessages.length,
                documents: allMessages
            } as Models.DocumentList<ChatMessage>;
        } catch (error) {
            console.error('Error al obtener mensajes:', error);
            throw error;
        }
    }
    
    /**
     * Obtiene los últimos N mensajes de un cliente (método alternativo si se necesita limitar)
     */
    async getRecentMessages(clientId: string, limit: number = 50): Promise<Models.DocumentList<ChatMessage>> {
        try {
            const response = await this.dbService.listDocuments<ChatMessage>(
                this.DATABASE_ID,
                this.TABLE_ID,
                [
                    Query.equal('client', clientId),
                    Query.select(['*', 'client.*']),
                    Query.orderDesc('timestamp'),
                    Query.limit(limit)
                ]
            );

            return response;
        } catch (error) {
            console.error('Error al obtener mensajes recientes:', error);
            throw error;
        }
    }

    async sendMessage(message: CreateChatMessage) {
        try {
            const newMessage = {
                ...message,
                timestamp: new Date()
            };

            const response = await this.dbService.createDocument(
                this.DATABASE_ID,
                this.TABLE_ID,
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
                this.TABLE_ID,
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
                this.TABLE_ID,
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