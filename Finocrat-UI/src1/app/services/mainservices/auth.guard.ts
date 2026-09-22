import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  canActivate(): boolean {
    const token = this.tokenService.getToken();
    const user = this.tokenService.getUser();
    
    console.log('🔒 AuthGuard - Checking authentication');
    console.log('Token value:', token);
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    // Check if token exists (not null, not undefined, not empty string)
    if (token && token !== 'null' && token !== 'undefined' && token.length > 0 && user) {
      console.log('✅ AuthGuard - Access granted');
      return true;
    }

    console.log('❌ AuthGuard - Access denied, redirecting to login');
    console.log('Reason: No valid token found');
    this.router.navigateByUrl('/dashboard/login');
    return false;
  }
}