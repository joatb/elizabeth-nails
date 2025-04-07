import { Models } from "appwrite";

export interface ChatMessage extends Models.Document {
    content: string;
    timestamp: Date;
    sent: boolean;
    client: string;
    read: boolean;
}