import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-angular';
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
export class ChatPage {
  chats: Map<string, { sender: string, message: string, timestamp: Date }[]> = new Map();
  clients: any[] = [];
  filteredClients: any[] = [];
  selectedClient: any = null;
  newMessage: string = '';
  isMenuCollapsed: boolean = false;
  searchTerm: string = '';

  // Iconos
  chevronLeft = ChevronLeft;
  chevronRight = ChevronRight;
  users = Users;
  search = Search;

  constructor(
    private clientsProvider: ClientsProvider
  ) {}

  ionViewDidEnter() {
    this.loadClients();
  }

  async loadClients() {
    try {
      const documentList = await this.clientsProvider.listClients();
      if (documentList && documentList.documents) {
        this.clients = documentList.documents;
        this.clients.forEach(client => {
          this.chats.set(client.$id, []);
        });
        this.sortClientsByLastMessage();
        this.filterClients();
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    }
  }

  sortClientsByLastMessage() {
    this.clients.sort((a, b) => {
      const messagesA = this.chats.get(a.$id) || [];
      const messagesB = this.chats.get(b.$id) || [];
      
      const lastMessageA = messagesA.length > 0 ? new Date(messagesA[messagesA.length - 1].timestamp) : new Date(0);
      const lastMessageB = messagesB.length > 0 ? new Date(messagesB[messagesB.length - 1].timestamp) : new Date(0);
      
      return lastMessageB.getTime() - lastMessageA.getTime();
    });
  }

  filterClients() {
    if (!this.searchTerm) {
      this.filteredClients = [...this.clients];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.filteredClients = this.clients.filter(client => 
      client.name.toLowerCase().includes(searchTermLower) ||
      client.phone.toLowerCase().includes(searchTermLower)
    );
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    this.toggleMenu();
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
