import { Models } from "appwrite";

export interface Service extends Models.Document {
  name: string;
  description: string;
  price: number;
  color: string;
}

