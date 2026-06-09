import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { Client } from '../providers/clients/models/client';
import { ClientsProvider } from '../providers/clients/clients.provider';

/**
 * Singleton que mantiene los clientes en memoria para toda la sesión.
 * Se carga una sola vez y se invalida solo ante create/update/delete.
 * Para búsqueda/chat/analytics — campos mínimos, sin appointments expandidos.
 */
@Injectable({
    providedIn: 'root'
})
export class ClientsStateService {
    private clientsSubject = new BehaviorSubject<Client[] | null>(null);
    private loading = false;

    clients$: Observable<Client[]> = this.clientsSubject.pipe(
        filter((clients): clients is Client[] => clients !== null)
    );

    constructor(private clientsProvider: ClientsProvider) {}

    async ensureLoaded(): Promise<Client[]> {
        if (this.clientsSubject.value !== null) {
            return this.clientsSubject.value;
        }

        if (this.loading) {
            return new Promise((resolve) => {
                this.clients$.pipe(take(1)).subscribe(resolve);
            });
        }

        this.loading = true;
        try {
            const clients = await this.clientsProvider.loadAllClientsForSearch();
            this.clientsSubject.next(clients);
            return clients;
        } finally {
            this.loading = false;
        }
    }

    getSnapshot(): Client[] {
        return this.clientsSubject.value ?? [];
    }

    invalidate(): void {
        this.clientsSubject.next(null);
    }
}
