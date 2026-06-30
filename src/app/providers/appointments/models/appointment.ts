import { SupabaseRecord } from '../../../models/supabase-record';
import { Client } from '../../clients/models/client';
import { Service } from '../../services/models/service';

export interface Appointment extends SupabaseRecord {
    client_id: string;
    client?: Client;
    service_id?: string | null;
    services?: Service | null;
    note: string;
    start_time: string;
    end_time: string;
    reminder_sent?: string | null;
}
