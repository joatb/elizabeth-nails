import { Account, Client } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('http://localhost/v1')
    .setProject('elizabeth-nails');

export const account = new Account(client);
export { ID } from 'appwrite';
