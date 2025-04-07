import { Models } from 'appwrite';
import { Appointment } from '../../appointments/models/appointment';

export interface Client extends Models.Document {
    name: string;
    phone: string;
    phone_country: string;
    appointments: Appointment[];
}