import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const isAuthenticated: () => Promise<boolean> = async() => {
  const authService = inject(AuthService);
  return authService.isAuthenticated(); // Change this to your actual authentication check
};

export const authGuard: CanActivateChildFn = async (childRoute, state) => {
  const router = inject(Router);
  if (await isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
