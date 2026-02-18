import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { MainAuthService } from './mainauth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private auth: MainAuthService,
    private router: Router
  ) {}

  canActivate(): boolean {

    if (this.auth.isLoggedIn()) {
      return true;
    }

    this.router.navigateByUrl('/dashboard/login');
    return false;
  }
}