import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular/standalone';
import { SharedModule } from '../modules/shared.module';

@Component({
  selector: 'login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [SharedModule, FormsModule]
})
export class LoginPage implements OnInit {

  protected email: string = '';
  protected password: string = '';

  constructor(
    private router: Router, 
    private authService: AuthService,
    private loadingCtrl: LoadingController) {

  }

  async ngOnInit() {
    // This method will be called after the component is initialized
    if(await this.authService.isAuthenticated()) {
      const loading = await this.loadingCtrl.create({
        spinner: 'crescent'
      });
  
      loading.present();
      this.router.navigate(['/']).finally(() => {
        loading.dismiss();
      });
    }
  }

  async login(email: string, password: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Iniciando sesión',
      spinner: 'crescent'
    });
    loading.present();
    if(!await this.authService.login(email, password)){
      loading.dismiss();
    } else {
      this.router.navigate(['/']).finally(() => {
        loading.dismiss();
      });
    }
  }

  async logout() {
    this.authService.logout();
  }
}
