import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { Service } from "./models/service";

@Injectable({
  providedIn: "root",
})
export class ServicesProvider {

  async listServices(): Promise<{ total: number; documents: Service[] }> {
    const { data, error, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('name');
    if (error) throw error;
    return { total: count ?? 0, documents: (data ?? []) as Service[] };
  }

  async createService(service: { name: string; description: string; price: number; color: string }) {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  }

  async updateService(serviceId: string, service: { name: string; description: string; price: number; color: string }) {
    const { data, error } = await supabase
      .from('services')
      .update(service)
      .eq('id', serviceId)
      .select()
      .single();
    if (error) throw error;
    return data as Service;
  }

  async deleteService(serviceId: string): Promise<void> {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);
    if (error) throw error;
  }
}
