import { Account, Client } from 'appwrite';
import { environment } from '../environments/environment';

export const client = new Client();

client
    .setEndpoint(environment.endpoint)
    .setProject('elizabeth-nails');

export const account = new Account(client);
export { ID } from 'appwrite';
