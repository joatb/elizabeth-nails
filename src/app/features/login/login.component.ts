import { Component, OnInit } from "@angular/core";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { LoadingController } from "@ionic/angular/standalone";
import { ToastController } from "@ionic/angular/standalone";
import { LoginFormComponent } from "../../ui/organisms/login-form/login-form.component";
import { AuthTemplateComponent } from "../../ui/templates/auth-template/auth-template.component";

@Component({
  selector: "login-page",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  imports: [AuthTemplateComponent, LoginFormComponent],
})
export class LoginPage implements OnInit {
  protected email: string = "";
  protected password: string = "";

  constructor(
    private router: Router,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
  ) {}

  async ngOnInit() {
    // This method will be called after the component is initialized
    if (await this.authService.isAuthenticated()) {
      const loading = await this.loadingCtrl.create({
        spinner: "crescent",
      });

      loading.present();
      this.router.navigate(["/"]).finally(() => {
        loading.dismiss();
      });
    }
  }

  async login(email: string, password: string) {
    const loading = await this.loadingCtrl.create({
      message: "Iniciando sesión",
      spinner: "crescent",
    });
    loading.present();
    if (!(await this.authService.login(email, password))) {
      loading.dismiss();
      this.toastCtrl
        .create({
          message: "Usuario o contraseña incorrectos",
          duration: 2000,
          color: "danger",
        })
        .then((toast) => toast.present());
    } else {
      this.router.navigate(["/"]).finally(() => {
        loading.dismiss();
      });
    }
  }

  async logout() {
    this.authService.logout();
  }
}
