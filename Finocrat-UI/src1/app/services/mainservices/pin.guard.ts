import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root'
})
export class PinGuard implements CanActivate {
  
  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.tokenService.getUser();
    const token = this.tokenService.getToken();
    
    console.log('🔒 PinGuard - Checking access to:', state.url);
    console.log('Has token:', !!token);
    console.log('User has PIN:', user?.pin);
    console.log('PIN verified:', sessionStorage.getItem('pin_verified'));
    
    if (!token) {
      console.log('❌ No token, redirecting to login');
      this.router.navigate(['/dashboard/login']);
      return false;
    }
    
    if (!user?.pin) {
      console.log('❌ No PIN set, redirecting to set-pin');
      this.router.navigate(['/dashboard/set-pin']);
      return false;
    }
    
    const isPinVerified = sessionStorage.getItem('pin_verified') === 'true';
    
    if (!isPinVerified) {
      console.log('❌ PIN not verified, redirecting to verify-pin');
      sessionStorage.setItem('redirect_url', state.url);
      this.router.navigate(['/dashboard/verify-pin']);
      return false;
    }
    
    console.log('✅ Access granted');
    return true;
  }
}