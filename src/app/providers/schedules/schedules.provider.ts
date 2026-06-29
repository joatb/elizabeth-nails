import { Injectable } from "@angular/core";
import { supabase } from '../../../lib/supabase';
import { Schedule } from "./models/schedule";

@Injectable({
    providedIn: 'root',
})
export class SchedulesProvider {

    async createSchedule(schedule: Omit<Schedule, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('schedules')
            .insert(schedule)
            .select()
            .single();
        if (error) throw error;
        return data as Schedule;
    }

    async listSchedules(): Promise<{ total: number; documents: Schedule[] }> {
        const { data, error, count } = await supabase
            .from('schedules')
            .select('*', { count: 'exact' });
        if (error) throw error;
        return { total: count ?? 0, documents: (data ?? []) as Schedule[] };
    }

    async deleteSchedule(scheduleId: string): Promise<void> {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId);
        if (error) throw error;
    }
}
