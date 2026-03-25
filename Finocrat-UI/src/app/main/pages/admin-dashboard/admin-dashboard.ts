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
    payInCount: 0,
    payOutCount: 0,
    users: [],
    payIns: [],
    payOuts: []
  };

  loading = false;
  errorMsg = '';

  // ✅ Accordion default open
  active: string = 'users';

  constructor(private service: HomeService) {}

  ngOnInit() {
    const today = new Date().toISOString().substring(0, 10);
    this.fromDate = today;
    this.toDate = today;

    this.loadData(); // ✅ fixed method name
  }

  // =============================
  // ACCORDION TOGGLE
  // =============================
  toggle(section: string) {
    this.active = this.active === section ? '' : section;
  }

  // =============================
  // LOAD DASHBOARD
  // =============================
  loadData() {
    this.loading = true;
    this.errorMsg = '';

    this.service.getDashboard(this.fromDate, this.toDate)
      .subscribe({
        next: (res) => {
          this.data = res || {
            payInCount: 0,
            payOutCount: 0,
            users: [],
            payIns: [],
            payOuts: []
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('Dashboard Error', err);
          this.errorMsg = 'Failed to load dashboard';
          this.loading = false;
        }
      });
  }
}
