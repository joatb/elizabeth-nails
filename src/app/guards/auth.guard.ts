import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

const isAuthenticated: () => boolean = () => {
  // Implement your authentication logic here
  const authService = inject(AuthService);
  return authService.isAuthenticated(); // Change this to your actual authentication check
};

export const authGuard: CanActivateChildFn = (childRoute, state) => {
  const router = inject(Router);
  if (isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
