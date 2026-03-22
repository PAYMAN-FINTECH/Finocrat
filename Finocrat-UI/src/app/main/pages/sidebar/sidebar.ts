import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

// ✅ Icons
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
  Users
} from 'lucide-angular';

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

  reportsOpen = false;
  adminOpen = false; // 🔥 NEW
  isAdmin = false; // 🔥 control flag

  // icons
  LayoutDashboard = LayoutDashboard;
  Wallet = Wallet;
  CreditCard = CreditCard;
  Layers = Layers;
  BarChart3 = BarChart3;
  ArrowDownCircle = ArrowDownCircle;
  ArrowUpCircle = ArrowUpCircle;
  User = User;
  LogOut = LogOut;
  Shield = Shield;   // 🔥 NEW
  Users = Users;     // 🔥 NEW

  constructor(private router: Router) {}

 ngOnInit() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // ✅ ONLY SHOW FOR "jurra"
    if (user?.name?.toLowerCase() === 'jurra') {
      this.isAdmin = true;
    }
  }

  toggleReports() {
    this.reportsOpen = !this.reportsOpen;
    if (this.reportsOpen) this.adminOpen = false;
  }

  toggleAdmin() {
    this.adminOpen = !this.adminOpen;
    if (this.adminOpen) this.reportsOpen = false;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/dashboard']);
  }
}
