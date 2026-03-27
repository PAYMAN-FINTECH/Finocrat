import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    SidebarComponent
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  isMobileSidebarOpen = false;
  username = 'User';

  ngOnInit() {
    const userPhone = localStorage.getItem('userPhone');
    if (userPhone) {
      this.username = userPhone;
    }
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  checkScreenSize() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      this.isMobileSidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
    if (this.isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
    document.body.style.overflow = '';
  }
}