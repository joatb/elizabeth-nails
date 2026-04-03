import { Routes } from '@angular/router';
import { LoginPage } from './features/login/login.component';
import { authGuard } from './guards/auth.guard';
import { environment } from 'src/environments/environment';

export const routes: Routes = [
  {
    path: '',
    canActivateChild: [
      authGuard
    ],
    loadChildren: () => import('./features/tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'login',
    component: LoginPage,
  },
];

if (!environment.production) {
  routes.push({
    path: 'ui-testing',
    loadChildren: () => import('./features/ui-testing/ui-testing.routes').then((m) => m.routes),
  });  
}