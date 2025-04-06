import { Models } from 'appwrite';

export interface Schedule extends Models.Document {
    start_time: string;
    end_time: string;
    days: string[];
}