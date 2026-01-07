import { Models } from "appwrite";

export interface UserPreferences extends Models.Preferences {
  theme?: string;
}
