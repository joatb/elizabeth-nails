import { Models } from 'appwrite';
import { Client } from '../../clients/models/client';

export interface Appointment extends Models.Document {
    note: string;
    start_time: string;
    end_time: string;
    client: Client;
}