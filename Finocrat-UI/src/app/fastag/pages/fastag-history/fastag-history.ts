// fastag/pages/fastag-history/fastag-history.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { FastagService } from '../../../services/fastgservices/fastag.service';

@Component({
  selector: 'app-fastag-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-container">
      <div class="history-card">
        <div class="card-header">
          <h3>📜 Recharge History</h3>
        </div>
        
        <div class="table-responsive" *ngIf="!isLoading">
          <table class="history-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Transaction ID</th>
                <th>Vehicle No</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of historyList; let i = index">
                <td>{{i + 1}}</td>
                <td>{{item.refId}}</td>
                <td>{{item.accountNo}}</td>
                <td>{{item.dateTime | date:'dd MMM yyyy, hh:mm a'}}</td>
                <td>₹ {{item.amount | number}}</td>
                <td>
                  <span class="status-badge" [class.success]="item.status === 'Success'" [class.failed]="item.status !== 'Success'">
                    {{item.status}}
                  </span>
                </td>
              </tr>
              <tr *ngIf="historyList.length === 0">
                <td colspan="6" class="empty-state">No recharge history found</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="loader-container" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Loading history...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    .history-card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .card-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px 24px;
    }
    .card-header h3 {
      margin: 0;
      color: white;
    }
    .table-responsive {
      overflow-x: auto;
      padding: 20px;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
    }
    .history-table th,
    .history-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .history-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #334155;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .status-badge.success {
      background: #d1fae5;
      color: #166534;
    }
    .status-badge.failed {
      background: #fee2e2;
      color: #991b1b;
    }
    .empty-state {
      text-align: center;
      color: #64748b;
      padding: 40px;
    }
    .loader-container {
      text-align: center;
      padding: 40px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 15px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class FastagHistoryComponent implements OnInit {
  historyList: any[] = [];
  isLoading = true;

  constructor(
    private fastagService: FastagService,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    this.fastagService.getHistory().subscribe({
      next: (res: any) => {
        this.historyList = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load history:', err);
        this.toastr.error('Failed to load history');
        this.isLoading = false;
      }
    });
  }
}