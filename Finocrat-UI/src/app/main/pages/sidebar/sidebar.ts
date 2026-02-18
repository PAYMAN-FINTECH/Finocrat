import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule   // 👉 VERY IMPORTANT
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
reportsOpen = false;
adminOpen = false;


constructor(private router: Router) {}

toggleReports() {
  this.reportsOpen = !this.reportsOpen;
}

toggleAdmin() {
  this.adminOpen = !this.adminOpen;
}
logout() {
  localStorage.clear();   // or remove specific token
  sessionStorage.clear();

  this.router.navigate(['/dashboard/login']);
}
}
