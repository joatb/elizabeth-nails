import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [FormsModule]
})
export class LoginPage {

  protected email: string = '';
  protected password: string = '';

  constructor(private authService: AuthService) {
  }

  async login(email: string, password: string) {
    this.authService.login(email, password);
  }

  async logout() {
    this.authService.logout();
  }
}
