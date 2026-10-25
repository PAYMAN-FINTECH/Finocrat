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
  AlertCircle,
  QrCode
} from 'lucide-angular';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../../services/mainservices/home.service';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';

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
  QrCode = QrCode;

  constructor(private router: Router, private tokenService: TokenService,  private toastr: ToastrService,private userService: HomeService, private razorService: RazorPaymentService) {}

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

  // Opens the QR page only when QR is enabled for the logged-in user
  openQrPayment() {
    const user = this.tokenService.getUser();
    if (!user?.userPhone) {
      this.toastr.error('User not found');
      return;
    }

    this.razorService.getQrStatus(user.userPhone).subscribe({
      next: (res) => {
        if (res.qrEnabled) {
          this.onLinkClick();
          this.router.navigate(['/app/qr-payment']);
        } else {
          this.toastr.info('QR payment is not enabled for your account');
        }
      },
      error: () => this.toastr.error('Failed to check QR payment status')
    });
  }

  // Logout
  logout() {
    this.tokenService.clear();
    sessionStorage.clear();
    this.router.navigate(['/dashboard/login']);
    this.toastr.success('Logged out successfully');
  }
}