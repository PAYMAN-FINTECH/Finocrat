

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { PayInService } from '../../../services/mainservices/payin.service';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-payout-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payout-history.html',
  styleUrls: ['./payout-history.css']
})
export class PayoutHistoryComponent implements OnInit {

  history: any[] = [];
  loading = false;

  fromDate: string = '';
  toDate: string = '';
  userPhone: string | null = null;

  constructor(private payinService: PayInService,private tokenService: TokenService) {}

  ngOnInit(): void {
    this.loadToday();
  }

  loadToday() {
    const today = new Date().toISOString().split('T')[0];
    this.fromDate = today;
    this.toDate = today;
    this.loadHistory();
  }

  loadHistory() {
    this.loading = true;
     this.userPhone = this.tokenService.getuserPhone();

    this.payinService.getPayoutHistory(this.fromDate, this.toDate, this.userPhone || undefined)
      .subscribe({
        next: (res) => {
          this.history = res;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  search() {
    this.loadHistory();
  }

  getTotalAmount(): number {
    return this.history
      .filter(x => x.status === true)
      .reduce((sum, x) => sum + x.amount, 0);
  }

  getSuccessCount(): number {
    return this.history.filter(x => x.status === true).length;
  }

  getFailedCount(): number {
    return this.history.filter(x => x.status === false).length;
  }

  downloadExcel() {

    if (!this.history.length) return;

    const exportData = this.history.map((x, i) => ({
      'S.No': i + 1,
      'Amount': x.amount,
      'Status': x.status ? 'SUCCESS' : 'FAILED',
      'Transaction ID': x.paymentId,
      'Date': new Date(x.created).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PayIn History');

    XLSX.writeFile(workbook, 'PayIn_History.xlsx');
  }
}