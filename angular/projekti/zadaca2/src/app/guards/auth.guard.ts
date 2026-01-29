import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Authentication } from '../services/authentication';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authentication);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  router.navigate(['/login']);
  return false;
};

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(Authentication);
    const router = inject(Router);
    
    if (!authService.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }
    
    if (authService.hasRole(allowedRoles)) {
      return true;
    }
    
    router.navigate(['/']);
    return false;
  };
};
