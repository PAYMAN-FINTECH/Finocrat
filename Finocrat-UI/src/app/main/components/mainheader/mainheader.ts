import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-mainheader',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mainheader.html',
  styleUrls: ['./mainheader.css'],
  encapsulation: ViewEncapsulation.None // IMPORTANT
})
export class MainheaderComponent implements OnInit {

  username: string = '';
  userId: string = '';
  isMenuOpen = false;

  constructor(private tokenService: TokenService,private router: Router,) {}

  ngOnInit(): void {
    const user = this.tokenService.getUser();
    if (user) {
      this.username = user.name;
      this.userId = user.userId;
    }
  }

  isLoggedIn(): boolean {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  goHome() {
    if (this.isLoggedIn()) {
      this.router.navigate(['/app/finhome']); // ✅ logged in
    } else {
      this.router.navigate(['/dashboard']); // ✅ not logged in
    }
  }
}
