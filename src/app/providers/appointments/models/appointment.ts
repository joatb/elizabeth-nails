import { Models } from 'appwrite';
import { Client } from '../../clients/models/client';
import { Service } from '../../services/models/service';

export interface Appointment extends Models.Document {
    note: string;
    start_time: string;
    end_time: string;
    client: Client | string;
    services?: Service | Service[] | string | string[] | null;
}
