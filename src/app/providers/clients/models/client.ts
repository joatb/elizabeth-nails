import { SupabaseRecord } from '../../../models/supabase-record';
import { Appointment } from '../../appointments/models/appointment';

export interface Client extends SupabaseRecord {
    name: string;
    phone: string;
    phone_country: string;
    appointments?: Appointment[];
}
