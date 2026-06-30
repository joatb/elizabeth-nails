import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { Client } from "./models/client";

@Injectable({
    providedIn: 'root',
})
export class ClientsProvider {

    async getClient(clientId: string): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .select('*, appointments(*)')
            .eq('id', clientId)
            .single();
        if (error) throw error;
        return data as Client;
    }

    async listClients(limit: number = 50, offset: number = 0): Promise<{ total: number; documents: Client[] }> {
        const { data, error, count } = await supabase
            .from('clients')
            .select('*, appointments(*)', { count: 'exact' })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Client[] };
    }

    async listAllClients(): Promise<{ total: number; documents: Client[] }> {
        const { data, error, count } = await supabase
            .from('clients')
            .select('*, appointments(*)', { count: 'exact' });
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Client[] };
    }

    async loadAllClientsForSearch(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('id, name, phone, phone_country');
        if (error) throw error;
        return (data ?? []) as Client[];
    }

    async loadClientsForGrid(): Promise<Client[]> {
        const { data, error } = await supabase
            .from('clients')
            .select('*, appointments(*)');
        if (error) throw error;
        return (data ?? []) as Client[];
    }

    async createClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at' | 'appointments'>): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    }

    async updateClient(clientId: string, client: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at' | 'appointments'>>): Promise<Client> {
        const { data, error } = await supabase
            .from('clients')
            .update(client)
            .eq('id', clientId)
            .select()
            .single();
        if (error) throw error;
        return data as Client;
    }

    async deleteClient(clientId: string): Promise<void> {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);
        if (error) throw error;
    }

    async searchClientsByName(searchTerm: string, limit: number = 50): Promise<Client[]> {
        if (!searchTerm || searchTerm.trim().length === 0) return [];
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name, phone, phone_country')
                .ilike('name', `%${searchTerm}%`)
                .limit(limit);
            if (error) throw error;
            return (data ?? []) as Client[];
        } catch (error) {
            console.error('Error searching clients by name:', error);
            return [];
        }
    }

    async listClientsPaginated(limit: number = 50, offset: number = 0): Promise<{ total: number; documents: Client[]; hasMore: boolean }> {
        const result = await this.listClients(limit, offset);
        return { ...result, hasMore: offset + limit < result.total };
    }
}
