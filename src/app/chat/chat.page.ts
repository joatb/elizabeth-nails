import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../modules/shared.module';
import { ClientsProvider } from '../providers/clients/clients.provider';
import { Client } from '../providers/clients/models/client';
import { ChatComponent } from './components/chat/chat.component';

@Component({
  selector: 'app-chat',
  templateUrl: 'chat.page.html',
  styleUrls: ['chat.page.scss'],
  imports: [CommonModule, SharedModule, FormsModule, ChatComponent],
  providers: []
})
export class ChatPage implements OnInit {
  chats: Map<string, { sender: string, message: string }[]> = new Map();
  clients: any[] = [];
  selectedClient: any = null;
  newMessage: string = '';

  constructor(
    private clientsProvider: ClientsProvider
  ) {}

  ngOnInit() {
    this.loadClients();
  }

  async loadClients() {
    try {
      const documentList = await this.clientsProvider.listClients();
      if (documentList && documentList.documents) {
        this.clients = documentList.documents;
        this.clients.forEach(client => {
          this.chats.set(client.name, []);
        });
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  }

  selectClient(client: Client) {
    this.selectedClient = client;
  }
}
