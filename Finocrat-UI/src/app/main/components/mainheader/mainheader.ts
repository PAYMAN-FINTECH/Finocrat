import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
export class MainheaderComponent implements OnInit {

  username: string = '';
  userId: string = '';
  isMenuOpen = false;

  // ✅ PROFILE IMAGE HANDLING
  profileImage: string = 'assets/images/profile.png';
  imageError: boolean = false;

  constructor(
    private tokenService: TokenService,
    private router: Router,
    private mainAuthService: MainAuthService
  ) {}

  ngOnInit(): void {
    const user = this.tokenService.getUser();
    if (user) {
      this.username = user.name;
      this.userId = user.userId;

      // optional dynamic image
      if (user.profileImage) {
        this.profileImage = user.profileImage;
      }
    }
  }

  isLoggedIn(): boolean {
    return this.mainAuthService.isLoggedIn();
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
