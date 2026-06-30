import { SupabaseRecord } from '../../../../models/supabase-record';

export interface ChatMessage extends SupabaseRecord {
    client_id: string;
    content: string;
    timestamp: string;
    sent: boolean;
    read: boolean;
}
