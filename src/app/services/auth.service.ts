import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { Models } from "appwrite";
import { catchError, firstValueFrom, from, map, Observable, of } from "rxjs";
import { account } from "../../lib/appwrite";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private loggedInUser: Observable<Models.User<Models.Preferences> | null>;

    constructor(
        private router: Router, 
        private alertCtrl: AlertController) {
        this.loggedInUser = from(account.get());
    }

    isAuthenticated() {
        return firstValueFrom(this.loggedInUser.pipe(
            map((user) => user != null),
            catchError(() => of(false))
        ));
    }

    async login(email: string, password: string) {
        try {
            await account.createEmailPasswordSession(email, password);
            this.loggedInUser = from(account.get());
            if(this.loggedInUser != null) {
                return true;
            }
            return false;
        } catch (error) {
            this.handleError(error);
            return false;
        }
    }

    async logout() {
        const alert = await this.alertCtrl.create({
            header: 'Cerrar Sesión',
            message: 'Quiere cerrar la sesión?',
            buttons: [
                {
                    text: 'Cancelar',
                    role: 'cancel',
                },
                {
                    text: 'OK',
                    role: 'confirm',
                    handler: async () => {
                        await account.deleteSession('current');
                        this.loggedInUser = of(null);
                        this.router.navigate(['/login']);
                    },
                },
            ],
        });

        await alert.present();
    }

    private async handleError(error: any) {
        switch (error.code) {
            case 429:
                if(error.type === 'general_rate_limit_exceeded') {
                    (await this.alertCtrl.create({
                        header: 'Se ha excedido el límite de intentos, intentelo más tarde (100 intentos por hora)',
                        buttons: ['OK']
                    })).present();
                }
                break;
        
            default:
                throw error;
        }
    }
}