import { SupabaseRecord } from '../../../models/supabase-record';

export interface Employee extends SupabaseRecord {
  name: string;
  color: string;
  active: boolean;
}
