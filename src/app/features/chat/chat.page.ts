import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-angular";
import { SharedModule } from "../../modules/shared.module";
import { Client } from "../../providers/clients/models/client";
import { ClientsStateService } from "../../services/clients-state.service";
import { ChatComponent } from "../../ui";

@Component({
  selector: "app-chat",
  templateUrl: "chat.page.html",
  styleUrls: ["chat.page.scss"],
  imports: [CommonModule, SharedModule, FormsModule, ChatComponent],
  providers: [],
})
export class ChatPage {
  chats: Map<string, { sender: string; message: string; timestamp: Date }[]> =
    new Map();
  clients: Client[] = [];
  filteredClients: Client[] = [];
  selectedClient: Client | null = null;
  newMessage: string = "";
  isMenuCollapsed: boolean = false;
  searchTerm: string = "";
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Iconos
  chevronLeft = ChevronLeft;
  chevronRight = ChevronRight;
  users = Users;
  search = Search;

  constructor(private clientsState: ClientsStateService) {}

  ionViewDidEnter() {
    this.loadClients();
  }

  async loadClients() {
    try {
      const allClients = await this.clientsState.ensureLoaded();
      if (allClients && allClients.length > 0) {
        this.clients = allClients;
        this.clients.forEach((client) => {
          this.chats.set(client.id, []);
        });
        this.sortClientsByLastMessage();
        // Inicialitzar filteredClients amb tots els clients
        this.filteredClients = [...this.clients];
        // Aplicar el filtre si hi ha un terme de cerca
        if (this.searchTerm && this.searchTerm.trim().length > 0) {
          this.filterClients();
        }
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  }

  sortClientsByLastMessage() {
    this.clients.sort((a, b) => {
      const messagesA = this.chats.get(a.id) || [];
      const messagesB = this.chats.get(b.id) || [];

      const lastMessageA =
        messagesA.length > 0
          ? new Date(messagesA[messagesA.length - 1].timestamp)
          : new Date(0);
      const lastMessageB =
        messagesB.length > 0
          ? new Date(messagesB[messagesB.length - 1].timestamp)
          : new Date(0);

      return lastMessageB.getTime() - lastMessageA.getTime();
    });
  }

  filterClients() {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce per evitar filtres excessius
    this.searchTimeout = setTimeout(() => {
      // Si no hi ha terme de cerca, mostrar tots els clients
      if (!this.searchTerm || this.searchTerm.trim().length === 0) {
        this.filteredClients = [...this.clients];
        return;
      }

      // Fer el filtre local sobre tots els clients ja carregats
      const searchTermLower = this.searchTerm.trim().toLowerCase();
      this.filteredClients = this.clients.filter((client) => {
        const nameMatch =
          client.name && client.name.toLowerCase().includes(searchTermLower);
        const phoneMatch =
          client.phone && client.phone.toLowerCase().includes(searchTermLower);
        const phoneCountryMatch =
          client.phone_country &&
          client.phone_country.toLowerCase().includes(searchTermLower);
        // Buscar també en el número complet (país + telèfon)
        const fullPhoneMatch =
          client.phone_country &&
          client.phone &&
          `${client.phone_country}${client.phone}`
            .toLowerCase()
            .includes(searchTermLower);

        return nameMatch || phoneMatch || phoneCountryMatch || fullPhoneMatch;
      });
    }, 200); // Debounce de 200ms
  }

  selectClient(client: Client) {
    this.selectedClient = client;
    this.toggleMenu();
  }

  toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}
