import { Routes } from '@angular/router';
import { LoginPage } from './login/login.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [
      authGuard
    ],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    component: LoginPage,
  }
];
