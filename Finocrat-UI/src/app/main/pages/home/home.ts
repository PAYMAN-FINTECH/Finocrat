import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HomeService } from '../../../services/mainservices/home.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-finhome',
  templateUrl: './home.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  styleUrls: ['./home.css']
})
export class FinhomeComponent implements OnInit {

  filterType: string = 'week';
  fromDate: string = '';
  toDate: string = '';

  stats: any = {
    totalCount: 0,
    totalAmount: 0,
    successCount: 0,
    failedCount: 0
  };

  constructor(private homeService: HomeService, private cdr: ChangeDetectorRef ) {}

  // ✅ FIXED: Use ngOnInit instead of ngAfterViewInit
  ngOnInit(): void {
    this.loadStats();
  }

  onFilterTypeChange(): void {
    if (this.filterType !== 'custom') {
      this.loadStats();
    }
  }

  applyFilter(): void {
    this.loadStats();
  }

  loadStats(): void {

  const payload = {
    filter: this.filterType,
    fromDate: this.fromDate || null,
    toDate: this.toDate || null
  };

  this.homeService.getStats(payload).subscribe({
    next: (res: any) => {

      this.stats.totalCount = res?.totalCount ?? 0;
      this.stats.totalAmount = res?.totalAmount ?? 0;
      this.stats.successCount = res?.successCount ?? 0;
      this.stats.failedCount = res?.failedCount ?? 0;

      this.cdr.detectChanges();   // ⭐ MAGIC LINE

    },
    error: err => console.error('API Error', err)
  });
}

}