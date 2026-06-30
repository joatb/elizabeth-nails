import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { Appointment } from "./models/appointment";

@Injectable({
    providedIn: 'root',
})
export class AppointmentsProvider {

    async listAppointments(month: number, year: number): Promise<{ total: number; documents: Appointment[] }> {
        const monthStr = month.toString().padStart(2, '0');
        const lastDay = new Date(year, month, 0).getDate();
        const startDate = `${year}-${monthStr}-01T00:00:00.000Z`;
        const endDate = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}T23:59:59.999Z`;

        const { data, error, count } = await supabase
            .from('appointments')
            .select('*, client:clients(*), services(*)', { count: 'exact' })
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time');
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Appointment[] };
    }

    async listAppointmentsInRange(startDate: Date, endDate: Date): Promise<{ total: number; documents: Appointment[] }> {
        const startIso = startDate.toISOString();
        const endIso = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999).toISOString();

        const { data, error, count } = await supabase
            .from('appointments')
            .select('*, client:clients(*), services(*)', { count: 'exact' })
            .gte('start_time', startIso)
            .lte('start_time', endIso)
            .order('start_time');
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Appointment[] };
    }

    async listAllAppointments(): Promise<{ total: number; documents: Appointment[] }> {
        const { data, error, count } = await supabase
            .from('appointments')
            .select('*, client:clients(*), services(*)', { count: 'exact' })
            .order('start_time', { ascending: false });
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Appointment[] };
    }

    async createAppointment(appointment: any): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select('*, client:clients(*), services(*)')
            .single();
        if (error) throw error;
        return data as Appointment;
    }

    async updateAppointment(appointmentId: string, data: any): Promise<Appointment> {
        const { data: updated, error } = await supabase
            .from('appointments')
            .update(data)
            .eq('id', appointmentId)
            .select('*, client:clients(*), services(*)')
            .single();
        if (error) throw error;
        return updated as Appointment;
    }

    async deleteAppointment(appointmentId: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', appointmentId);
        if (error) throw error;
    }
}
