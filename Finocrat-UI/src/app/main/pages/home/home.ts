import { Component, OnInit } from '@angular/core';
import { HomeService } from '../../../services/mainservices/home.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-finhome',
  templateUrl: './home.html',
  imports: [CommonModule,ReactiveFormsModule, FormsModule],
  standalone: true,
  styleUrls: ['./home.css']
})
export class FinhomeComponent implements OnInit {

  filterType: string = 'week';
  fromDate: string = '';
  toDate: string = '';

  stats = {
    totalCount: 0,
    totalAmount: 0,
    successCount: 0,
    failedCount: 0
  };

  constructor(private homeService: HomeService) {}

  ngOnInit() {
    this.loadStats();
  }

  onFilterTypeChange() {
    if (this.filterType !== 'custom') {
      this.loadStats();
    }
  }

  applyFilter() {
    this.loadStats();
  }

  loadStats() {
  const payload = {
    filter: this.filterType,
    fromDate: this.fromDate || null,
    toDate: this.toDate || null
  };

  this.homeService.getStats(payload).subscribe({
    next: res => this.stats = res,
    error: err => console.error('API Error', err)
  });
}

}
