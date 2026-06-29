import { SupabaseRecord } from '../../../models/supabase-record';

export interface Schedule extends SupabaseRecord {
    start_time: string;
    end_time: string;
    days: string[];
}
