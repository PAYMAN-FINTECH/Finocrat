import { Component, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../../services/mainservices/token.service';
import { MainAuthService } from '../../../services/mainservices/mainauth.service';

@Component({
  selector: 'app-mainheader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mainheader.html',
  styleUrls: ['./mainheader.css'],
  encapsulation: ViewEncapsulation.None
})
export class MainheaderComponent {

  isMenuOpen = false;

  // ✅ PROFILE IMAGE HANDLING
  imageError: boolean = false;

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private mainAuthService: MainAuthService
  ) {}

  get username(): string {
    return this.tokenService.getUser()?.name ?? '';
  }

  get userId(): string {
    return this.tokenService.getUser()?.userId ?? '';
  }

  get profileImage(): string {
    return this.tokenService.getUser()?.profileImage || 'assets/images/profile.png';
  }

  // Reads the same session that login saves (TokenService), so the header updates after login.
  isLoggedIn(): boolean {
    return !!this.tokenService.getToken() && !this.tokenService.isTokenExpired() && !!this.tokenService.getUser();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goHome() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/app/finhome']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  // ✅ IMAGE ERROR HANDLER
  onImageError() {
    this.imageError = true;
  }
}
