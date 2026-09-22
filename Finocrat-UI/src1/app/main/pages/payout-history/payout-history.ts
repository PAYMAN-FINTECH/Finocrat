import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';
import { PayInService } from '../../../services/mainservices/payin.service';
import { TokenService } from '../../../services/mainservices/token.service';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  constructor(private payinService: PayInService, private tokenService: TokenService) {}

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
      'Commission': x.paoutCommission,
      'Card No': x.cardNumber,
      'Status': x.status ? 'SUCCESS' : 'FAILED',
      'Result': x.result,
      'Transaction ID': x.txnReferenceId,
      'Mode': x.type,
      'Date': new Date(x.created).toLocaleString()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payout History');
    XLSX.writeFile(workbook, 'Payout_History.xlsx');
  }

  async downloadReceipt(item: any) {
    // Create hidden container
    const receiptDiv = document.createElement('div');
    receiptDiv.style.position = 'absolute';
    receiptDiv.style.top = '-9999px';
    receiptDiv.style.left = '-9999px';
    receiptDiv.style.backgroundColor = '#ffffff';
    receiptDiv.style.padding = '20px';
    receiptDiv.style.width = '550px';
    receiptDiv.style.fontFamily = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    receiptDiv.style.borderRadius = '12px';
    receiptDiv.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';

    // Format date
    const formattedDate = new Date(item.created).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Build receipt HTML with tables
    receiptDiv.innerHTML = `
      <div style="text-align: center; border-bottom: 3px solid #6a5af9; padding-bottom: 12px; margin-bottom: 20px;">
        <h2 style="margin:0; color:#6a5af9; font-weight:600;">CC BILL RECEIPT</h2>
        <p style="margin:5px 0 0; color:#666; font-size:13px;">Withdrawal Transaction</p>
      </div>

      <!-- Transaction Details Table -->
      <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size:14px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; background:#f9f9f9; width:40%;"><strong>Transaction ID</strong></td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${item.txnReferenceId || item.paymentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; background:#f9f9f9;"><strong>Date & Time</strong></td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; background:#f9f9f9;"><strong>User Phone</strong></td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${this.userPhone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; background:#f9f9f9;"><strong>Card Number</strong></td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${item.cardNumber || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e0e0e0; background:#f9f9f9;"><strong>Mode</strong></td>
          <td style="padding: 8px; border: 1px solid #e0e0e0;">${item.type || 'N/A'}</td>
        </tr>
      </table>

      <!-- Amount Breakdown Table -->
      <table style="width:100%; border-collapse: collapse; margin-bottom: 20px; font-size:14px;">
        <tr style="background:#f0f0f0;">
          <th style="padding: 10px; border: 1px solid #ccc; text-align:left;">Description</th>
          <th style="padding: 10px; border: 1px solid #ccc; text-align:right;">Amount (₹)</th>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ccc;">Withdrawal Amount</td>
          <td style="padding: 10px; border: 1px solid #ccc; text-align:right; font-weight:600;">${item.amount}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ccc;">Commission</td>
          <td style="padding: 10px; border: 1px solid #ccc; text-align:right;">${item.paoutCommission?.toFixed(2) || '0.00'}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding: 10px; border: 1px solid #ccc;"><strong>Net Debit</strong></td>
          <td style="padding: 10px; border: 1px solid #ccc; text-align:right; font-weight:600;">
            ${(item.amount + (item.paoutCommission || 0)).toFixed(2)}
          </td>
        </tr>
      </table>

      <!-- Result & Status -->
      <div style="background: ${item.status === true ? '#e8f9f0' : item.status === false ? '#ffe8e8' : '#fff4e5'}; 
                  padding: 12px; border-radius: 8px; text-align: center; margin-bottom: 15px;">
        <strong style="color: ${item.status === true ? '#28c76f' : item.status === false ? '#ea5455' : '#ff9f43'};">
          Status: ${item.status === true ? 'SUCCESS' : item.status === false ? 'FAILED' : 'PENDING'}
        </strong>
        ${item.result ? `<div style="margin-top:5px; font-size:12px;">Result: ${item.result}</div>` : ''}
      </div>

      <!-- Footer -->
      <div style="text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px;">
        This is a computer-generated receipt. No signature required.
      </div>
    `;

    document.body.appendChild(receiptDiv);

    try {
      const canvas = await html2canvas(receiptDiv, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const imgWidth = 180; // mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 15, 15, imgWidth, imgHeight);
      pdf.save(`Payout_Receipt_${item.txnReferenceId || item.paymentId}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      document.body.removeChild(receiptDiv);
    }
  }
}