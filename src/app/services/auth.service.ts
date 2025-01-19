import { Models } from "appwrite";
import { account } from "../../lib/appwrite";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private loggedInUser: Models.User<Models.Preferences> | null = null;

    constructor(private router: Router, private alertCtrl: AlertController) {
    }

    isAuthenticated() {
        return this.loggedInUser !== null;
    }

    async login(email: string, password: string) {
        try {
            await account.createEmailPasswordSession(email, password);
            this.loggedInUser = await account.get();
            if(this.loggedInUser != null) {
                this.router.navigate(['/']);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    async logout() {
        await account.deleteSession('current');
        this.loggedInUser = null;
    }

    private async handleError(error: any) {
        switch (error.code) {
            case 429:
                if(error.type === 'general_rate_limit_exceeded') {
                    (await this.alertCtrl.create({
                        header: 'Se ha excedido el límite de intentos, intentelo más tarde (10 intentos por hora)',
                        buttons: ['OK']
                    })).present();
                }
                break;
        
            default:
                break;
        }
    }
}