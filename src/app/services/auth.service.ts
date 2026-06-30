import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { AlertController } from '@ionic/angular/standalone';
import { User } from "@supabase/supabase-js";
import { catchError, firstValueFrom, from, map, Observable, of } from "rxjs";
import { supabase } from "../../lib/supabase";
import { UserPreferences } from "../models/user-preferences";

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private loggedInUser: Observable<User | null>;

    constructor(
        private router: Router,
        private alertCtrl: AlertController) {
        this.loggedInUser = from(supabase.auth.getUser()).pipe(
            map(({ data }) => data.user)
        );
    }

    isAuthenticated() {
        return firstValueFrom(this.loggedInUser.pipe(
            map((user) => user != null),
            catchError(() => of(false))
        ));
    }

    async login(email: string, password: string) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            this.loggedInUser = of(data.user);
            return data.user != null;
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
                        await supabase.auth.signOut();
                        this.loggedInUser = of(null);
                        this.router.navigate(['/login']);
                    },
                },
            ],
        });

        await alert.present();
    }

    async saveUserPreferences(preferences: UserPreferences) {
      try {
        await supabase.auth.updateUser({ data: preferences });
      } catch (error) {
        console.error('Error al guardar preferencias de usuario:', error);
        this.handleError(error);
      }
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
