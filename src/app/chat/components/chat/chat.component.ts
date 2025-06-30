import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatProvider } from '../../../providers/chat/chat.provider';
import { WhatsAppService } from '../../../services/whatsapp.service';
import { ChatMessage } from './models/chat-message';
import { LucideAngularModule, ChevronLeft, ChevronRight, Users } from 'lucide-angular';

@Component({
  selector: 'app-chat-messages',
  templateUrl: 'chat.component.html',
  styleUrls: ['chat.component.scss'],
  imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class ChatComponent implements OnInit, OnDestroy, OnChanges {
  @Input() selectedClient: any;
  @Output() toggleMenu = new EventEmitter<void>();
  
  // Iconos
  chevronLeft = ChevronLeft;
  chevronRight = ChevronRight;
  users = Users;

  chatHistory?: ChatMessage[];
  messages: {
    content: string;
    timestamp: Date;
    sent: boolean;
    client: string;
    read: boolean;
  }[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  recipientName: string = '';
  recipientAvatar: string = 'assets/default-avatar.png';
  isOnline: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private whatsAppService: WhatsAppService, 
    private chatProvider: ChatProvider) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedClient'] && changes['selectedClient'].currentValue) {
      this.recipientName = this.selectedClient.name;
      this.loadChatHistory();
      this.setupWebhook();
    }
  }

  ngOnInit() {
    // No cargar historial aquí para evitar duplicados
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadChatHistory() {
    // TODO: Implementar carga de historial desde backend
    this.chatHistory = (await this.chatProvider.getMessages(this.selectedClient.$id)).documents;
    this.messages = this.chatHistory.map(message => ({
      content: message.content,
      timestamp: new Date(message.timestamp),
      sent: message.sent,
      client: message.client,
      read: message.read
    }));

    this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private setupWebhook() {
    // TODO: Implementar configuración de webhook para recibir mensajes
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedClient) {
      const sub = this.whatsAppService.sendMessage(this.selectedClient.phone_country + this.selectedClient.phone, this.newMessage)
        .subscribe({
          next: () => {
            this.messages.push({
              content: this.newMessage,
              timestamp: new Date(),
              sent: true,
              client: this.selectedClient.$id,
              read: false
            });
            this.chatProvider.sendMessage({
              content: this.newMessage,
              timestamp: new Date(),
              sent: true,
              client: this.selectedClient.$id,
              read: false
            });
            this.newMessage = '';
          },
          error: (error) => {
            console.error('Error al enviar mensaje:', error);
          }
        });
      this.subscriptions.push(sub);
    }
  }
}