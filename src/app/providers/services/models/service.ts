import { SupabaseRecord } from '../../../models/supabase-record';

export interface Service extends SupabaseRecord {
  name: string;
  description: string;
  price: number;
  color: string;
}
