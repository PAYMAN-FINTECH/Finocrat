import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MainAuthService } from './mainauth.service';

@Injectable({ providedIn: 'root' })
export class LoginGuard implements CanActivate {

  constructor(
    private auth: MainAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/app/finhome']);
      return false;
    }
    return true;
  }
}