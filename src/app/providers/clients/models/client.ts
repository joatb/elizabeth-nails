import { Models } from 'appwrite';
import { Appointment } from '../../appointments/models/appointment';

export interface Client extends Models.Document {
    name: string;
    appointments: Appointment[];
}