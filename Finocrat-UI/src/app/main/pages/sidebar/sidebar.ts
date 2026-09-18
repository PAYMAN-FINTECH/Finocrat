import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

// Icons
import {
  LayoutDashboard,
  Wallet,
  CreditCard,
  Layers,
  BarChart3,
  ArrowDownCircle,
  ArrowUpCircle,
  User,
  LogOut,
  Shield,
  Users,
  Search,
  BadgeCheck,
  BookText,
  AlertCircle
} from 'lucide-angular';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent {

  @Output() linkClicked = new EventEmitter<void>();
  
  reportsOpen = false;
  adminOpen = false;
  isAdmin = false;
  isUserTypeId = 0;
  isCollapsed = false;
  userpphone: string | null = null;

  // Icons
  LayoutDashboard = LayoutDashboard;
  Wallet = Wallet;
  CreditCard = CreditCard;
  Layers = Layers;
  BarChart3 = BarChart3;
  ArrowDownCircle = ArrowDownCircle;
  ArrowUpCircle = ArrowUpCircle;
  User = User;
  LogOut = LogOut;
  Shield = Shield;
  Users = Users;
  Search = Search;
  BadgeCheck = BadgeCheck;
  BookText = BookText;
  AlertCircle = AlertCircle;

  constructor(private router: Router, private tokenService: TokenService,  private toastr: ToastrService,private userService: HomeService) {}

  ngOnInit() {
     const user = this.tokenService.getUser();
     this.isAdmin = user.isAdmin || false;

  if (user?.userPhone) {
    this.userpphone = user.userPhone;
    this.loadUser(user.userPhone);
  }
    
    // Load collapse state from localStorage
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      this.isCollapsed = savedState === 'true';
    }
  }

  loadUser(userPhone: string): void {
  this.userService.getCurrentUser(userPhone).subscribe({
    next: (user) => {
      //this.isAdmin = user.isAdmin;
      this.isUserTypeId = user.userTypeId;
    },
    error: (err) => {
      console.error('Failed to load user', err);
    }
  });
}

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('sidebarCollapsed', String(this.isCollapsed));
    
    // Close submenus when collapsing
    if (this.isCollapsed) {
      this.reportsOpen = false;
      this.adminOpen = false;
    }
  }

  toggleReports() {
    if (!this.isCollapsed) {
      this.reportsOpen = !this.reportsOpen;
      if (this.reportsOpen) this.adminOpen = false;
    }
  }

  toggleAdmin() {
    if (!this.isCollapsed) {
      this.adminOpen = !this.adminOpen;
      if (this.adminOpen) this.reportsOpen = false;
    }
  }

  onLinkClick() {
    this.linkClicked.emit();
  }

  // Logout
  logout() {
    this.tokenService.clear();
    sessionStorage.clear();
    this.router.navigate(['/dashboard/login']);
    this.toastr.success('Logged out successfully');
  }
}