import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { WhatsAppService } from '../../services/whatsapp.service';
import { ChatProvider } from '../../providers/chat/chat.provider';
import { ChatMessage } from '../../chat/components/chat/models/chat-message';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-messages',
  templateUrl: 'chat.component.html',
  styleUrls: ['chat.component.scss'],
  imports: [FormsModule]
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() selectedClient: any;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  recipientName: string = '';
  recipientAvatar: string = 'assets/default-avatar.png';
  isOnline: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private whatsAppService: WhatsAppService,
    private chatProvider: ChatProvider
  ) {}

  ngOnInit() {
    if (this.selectedClient) {
      this.recipientName = this.selectedClient.name;
      this.loadChatHistory();
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private async loadChatHistory() {
    try {
      this.messages = await this.chatProvider.getMessages(this.selectedClient.id);
    } catch (error) {
      console.error('Error al cargar el historial de chat:', error);
    }
  }

  async sendMessage() {
    if (this.newMessage.trim() && this.selectedClient) {
      try {
        // Enviar mensaje a WhatsApp
        const whatsappSub = this.whatsAppService.sendMessage(this.selectedClient.phone, this.newMessage)
          .subscribe({
            next: async () => {
              // Guardar mensaje en Appwrite
              const message: Omit<ChatMessage, 'timestamp'> = {
                content: this.newMessage,
                sent: true,
                client: this.selectedClient.id
              };

              const savedMessage = await this.chatProvider.sendMessage(message);
              this.messages.push(savedMessage);
              this.newMessage = '';
            },
            error: (error) => {
              console.error('Error al enviar mensaje:', error);
            }
          });
        this.subscriptions.push(whatsappSub);
      } catch (error) {
        console.error('Error al guardar el mensaje:', error);
      }
    }
  }
} 