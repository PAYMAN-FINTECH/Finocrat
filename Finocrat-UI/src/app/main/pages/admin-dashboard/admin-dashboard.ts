import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {

  fromDate: string = '';
  toDate: string = '';

  data: any = {
    summary: {},
    users: [],
    payIns: [],
    payOuts: []
  };

  loading = false;
  errorMsg = '';

  active: string = 'users';

  constructor(private service: HomeService) {}

  ngOnInit() {
    const today = new Date().toISOString().substring(0, 10);
    this.fromDate = today;
    this.toDate = today;

    this.loadData();
  }

  toggle(section: string) {
    this.active = this.active === section ? '' : section;
  }

  loadData() {
    this.loading = true;
    this.errorMsg = '';

    this.service.getDashboard(this.fromDate, this.toDate)
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
        },
        error: () => {
          this.errorMsg = 'Failed to load dashboard';
          this.loading = false;
        }
      });
  }

  // 🔥 GET USER NAME FROM PHONE
  getUserName(phone: string): string {
    const user = this.data?.users?.find((u: any) => u.userPhone === phone);
    return user ? user.userName : phone;
  }
}