import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';

type ReviewFilter = 'PENDING' | 'SUCCESS' | 'REJECTED' | 'ALL';

@Component({
  selector: 'app-qr-amount',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-amount.html',
  styleUrls: ['./qr-amount.css']
})
export class QrAmountComponent implements OnInit {

  requests: any[] = [];
  filter: ReviewFilter = 'PENDING';
  loading = false;
  reviewingId: string | null = null;

  fromDate = this.todayIso();
  toDate = this.todayIso();
  search = '';

  readonly filters: ReviewFilter[] = ['PENDING', 'SUCCESS', 'REJECTED', 'ALL'];

  constructor(private razorService: RazorPaymentService, private toastr: ToastrService) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  todayIso(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  resetToToday() {
    this.fromDate = this.todayIso();
    this.toDate = this.todayIso();
  }

  loadRequests() {
    this.loading = true;
    this.razorService.getQrRequests().subscribe({
      next: (res) => {
        this.requests = res || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Failed to load QR receipts');
      }
    });
  }

  get dateFilteredRequests(): any[] {
    return this.requests.filter(r => {
      const day = String(r.created ?? '').substring(0, 10);
      if (this.fromDate && day < this.fromDate) return false;
      if (this.toDate && day > this.toDate) return false;
      return true;
    });
  }

  get visibleRequests(): any[] {
    const term = this.search.trim().toLowerCase();
    return this.dateFilteredRequests.filter(r => {
      if (this.filter !== 'ALL' && r.result !== this.filter) return false;
      if (!term) return true;
      return [r.userPhone, r.userEmail, r.utr, String(r.amount)]
        .some(v => String(v ?? '').toLowerCase().includes(term));
    });
  }

  countFor(status: ReviewFilter): number {
    if (status === 'ALL') return this.dateFilteredRequests.length;
    return this.dateFilteredRequests.filter(r => r.result === status).length;
  }

  review(item: any, approve: boolean) {
    const action = approve ? 'approve' : 'reject';
    if (!confirm(`Are you sure you want to ${action} this receipt?\n\nUTR: ${item.utr}\nAmount: ₹${item.amount}`)) {
      return;
    }

    this.reviewingId = item.id;
    this.razorService.reviewQrReceipt(item.id, approve).subscribe({
      next: (res) => {
        this.reviewingId = null;
        if (res?.success) {
          this.toastr.success(res.message);
          this.loadRequests();
        } else {
          this.toastr.error(res?.message || 'Action failed');
        }
      },
      error: (err) => {
        this.reviewingId = null;
        this.toastr.error(err?.error?.message || 'Server error');
      }
    });
  }
}
