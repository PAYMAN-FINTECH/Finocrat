import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-bbps',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './bbps.html',
  styleUrls: ['./bbps.css']
})
export class BbpsComponent implements OnInit {
  constructor(private http: HttpClient) {}

  apiUrl = "https://localhost:7081/api/BillPayments";
  apiUrl1 = "https://thefinocrat.com/api/BillPayments";

  activeTab = "pay";
  toastMessage = "";
  toastType: 'success' | 'error' | 'warning' = 'success';
  toastTimeout: any;

  categories: any[] = [];
  billers: any[] = [];
  selectedCategory = "";
  selectedBiller = "";
  cardNumber = "";
  registeredMobile = "";
  billDetails: any = {};
  amount: any = "";
  loadingFetch = false;
  loadingPay = false;
  loadingBillers = false;
  disableCategory = false;
  disableBiller = false;
  disableCustomerFields = false;
  showCustomerCard = false;
  showFetchButton = false;
  showBillCard = false;

  // Custom dropdown
  categoryDropdownOpen = false;

  queryMobile = "";
  queryFromDate = "";
  queryToDate = "";
  queryTxnRef = "";
  queryResult: any = null;
  loadingQuery = false;

  complaintMobile = "";
  complaintType = "";
  participationType = "";
  serviceReason = "";
  complaintDescription = "";
  complaintResponse: any = null;
  loadingComplaint = false;

  complaintId = "";
  complaintStatusType = "";
  complaintStatusResult: any = null;
  loadingStatus = false;

  showPaymentReceipt = false;
  
  // Receipt data
  receiptData = {
    billerName: "Credit Card Bill",
    mobileNumber: "9849800697",
    billNumber: "BBPS123456789",
    billDate: "11/06/2026",
    dueDate: "11/06/2026",
    transactionId: "CC0119951234567899876541",
    registeredMobile: "9849800697",
    paymentMode: "Internet Banking",
    paymentChannel: "Internet Banking (Logged In)",
    billAmount: "1250.75",
    convenienceFee: "0.00",
    totalAmount: "1250.75",
    transactionDateTime: "11/06/2026 23:17:03",
    status: "PAID"  
  };

  // Audio for success sound
  private successAudio: HTMLAudioElement | undefined;

  ngOnInit(): void {
    this.getCategories();
    // Preload success sound – update path to your actual MP3 file
    this.successAudio = new Audio('assets/sounds/BharatConnect MOGO 270824.mp3');
    this.successAudio.load();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.clearToast();
  }

  showMessage(type: 'success' | 'error' | 'warning', message: string) {
    this.toastType = type;
    this.toastMessage = message;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.clearToast(), 5000);
  }

  clearToast() {
    this.toastMessage = "";
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  // ==================== CUSTOM DROPDOWN METHODS ====================
  toggleCategoryDropdown() {
    if (!this.disableCategory) {
      this.categoryDropdownOpen = !this.categoryDropdownOpen;
    }
  }

  closeCategoryDropdown(event: Event) {
    if (!(event.target as HTMLElement).closest('.custom-dropdown')) {
      this.categoryDropdownOpen = false;
    }
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.categoryDropdownOpen = false;
    this.onCategoryChange();
  }

  // ==================== API CALLS ====================
  getCategories() {
    this.http.get<any[]>(`${this.apiUrl1}/GetCategories`).subscribe({
      next: (res) => this.categories = res,
      error: () => this.showMessage('error', 'Failed to load categories')
    });
  }

  onCategoryChange() {
    this.selectedBiller = "";
    this.billers = [];
    this.resetBillFlow();
    if (!this.selectedCategory) return;
    this.loadingBillers = true;
    this.getBillers(this.selectedCategory);
  }

  getBillers(category: string) {
    this.http.get<any>(`${this.apiUrl1}/GetBillers?billerId=${category}`).subscribe({
      next: (res) => {
        this.loadingBillers = false;
        const billerData = res?.billerInfoResponse?.biller;
        if (billerData) {
          this.billers = Array.isArray(billerData) ? billerData : [billerData];
        } else {
          this.billers = [];
        }
      },
      error: () => {
        this.loadingBillers = false;
        this.showMessage('error', 'Failed to load billers');
      }
    });
  }

  onBillerChange() {
    if (!this.selectedBiller) return;
    this.disableCategory = true;
    this.disableBiller = true;
    this.showCustomerCard = true;
    this.showFetchButton = true;
  }

  fetchBill() {
    if (!this.cardNumber?.trim()) {
      this.showMessage('warning', 'Please enter card number');
      return;
    }
    if (!this.registeredMobile?.trim() || this.registeredMobile.length !== 10) {
      this.showMessage('warning', 'Please enter a valid 10-digit mobile number');
      return;
    }
    this.loadingFetch = true;
    this.http.post<any>(`${this.apiUrl1}/FetchBill`, {
      billerId: this.selectedBiller,
      cardNumber: this.cardNumber,
      mobileNumber: this.registeredMobile
    }).subscribe({
      next: (res) => {
        this.loadingFetch = false;
        this.billDetails = res;
        this.amount = res.billAmount || '';
        this.showBillCard = true;
        this.showFetchButton = false;
        this.disableCustomerFields = true;
      },
      error: () => {
        this.loadingFetch = false;
        this.showMessage('error', 'Failed to fetch bill. Please check details.');
      }
    });
  }

  // ==================== PAY BILL - DIRECT MODAL WITH SOUND ====================
  payBill() {
    if (!this.amount || this.amount <= 0) {
      this.showMessage('warning', 'Please enter a valid amount');
      return;
    }
    if (!confirm(`Pay ₹${this.amount} to ${this.billDetails.customerName || 'Biller'}?`)) return;

    // Update receipt data with dynamic values
    this.receiptData = {
      ...this.receiptData,
      billerName: this.billDetails.billerName || this.receiptData.billerName,
      mobileNumber: this.registeredMobile || this.receiptData.mobileNumber,
      billNumber: this.billDetails.billNumber || this.receiptData.billNumber,
      billDate: this.billDetails.billDate || this.receiptData.billDate,
      dueDate: this.billDetails.dueDate || this.receiptData.dueDate,
      registeredMobile: this.registeredMobile || this.receiptData.registeredMobile,
      billAmount: this.amount,
      totalAmount: this.amount,
      transactionDateTime: new Date().toLocaleString(),
      status: "PAID"
    };

    // Play success sound (reset to start)
    if (this.successAudio) {
      this.successAudio.currentTime = 0;
      this.successAudio.play().catch(err => console.warn('Audio play failed:', err));
    }

    // Show modal
    this.showPaymentReceipt = true;
  }

  closeReceiptModal() {
    this.showPaymentReceipt = false;
  }

  printReceipt() {
    const printContents = document.querySelector('.modal-container')?.cloneNode(true) as HTMLElement;
    if (!printContents) return;
    const closeBtn = printContents.querySelector('.modal-close');
    if (closeBtn) closeBtn.remove();
    const footer = printContents.querySelector('.modal-footer');
    if (footer) footer.remove();
    const win = window.open('', '_blank');
    win?.document.write(`
      <html><head><title>Payment Receipt</title><link rel="stylesheet" href="bbps.css"></head>
      <body>${printContents.outerHTML}</body></html>
    `);
    win?.document.close();
    win?.print();
  }

  makeAnotherPayment() {
    this.showPaymentReceipt = false;
    this.activeTab = 'pay';
    this.reset();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  reset() {
    this.selectedCategory = "";
    this.selectedBiller = "";
    this.cardNumber = "";
    this.registeredMobile = "";
    this.billDetails = {};
    this.amount = "";
    this.showCustomerCard = false;
    this.showFetchButton = false;
    this.showBillCard = false;
    this.disableCategory = false;
    this.disableBiller = false;
    this.disableCustomerFields = false;
    this.billers = [];
  }

  private resetBillFlow() {
    this.cardNumber = "";
    this.registeredMobile = "";
    this.billDetails = {};
    this.amount = "";
    this.showCustomerCard = false;
    this.showFetchButton = false;
    this.showBillCard = false;
    this.disableCategory = false;
    this.disableBiller = false;
    this.disableCustomerFields = false;
  }

  queryTransaction() {
    if (!this.queryMobile && !this.queryTxnRef) {
      this.showMessage('warning', 'Enter either Mobile Number + Date Range or Transaction Reference');
      return;
    }
    this.loadingQuery = true;
    this.http.post<any>(`${this.apiUrl1}/QueryTransaction`, {
      mobileNumber: this.queryMobile,
      fromDate: this.queryFromDate,
      toDate: this.queryToDate,
      transactionRefId: this.queryTxnRef
    }).subscribe({
      next: (res) => {
        this.loadingQuery = false;
        this.queryResult = res;
        if (!res || Object.keys(res).length === 0) this.showMessage('warning', 'No transaction found');
      },
      error: () => {
        this.loadingQuery = false;
        this.showMessage('error', 'Failed to query transaction');
      }
    });
  }

  raiseComplaint() {
    if (!this.complaintMobile?.trim() || this.complaintMobile.length !== 10) {
      this.showMessage('warning', 'Valid 10-digit mobile number is required');
      return;
    }
    if (!this.complaintType) {
      this.showMessage('warning', 'Please select complaint type');
      return;
    }
    if (!this.participationType) {
      this.showMessage('warning', 'Please select participation type');
      return;
    }
    if (!this.complaintDescription?.trim()) {
      this.showMessage('warning', 'Please enter complaint description');
      return;
    }
    this.loadingComplaint = true;
    this.http.post<any>(`${this.apiUrl1}/RaiseComplaint`, {
      mobileNumber: this.complaintMobile,
      complaintType: this.complaintType,
      participationType: this.participationType,
      serviceReason: this.serviceReason,
      description: this.complaintDescription
    }).subscribe({
      next: (res) => {
        this.loadingComplaint = false;
        this.complaintResponse = res;
        this.showMessage('success', `Complaint raised! ID: ${res.complaintId}`);
      },
      error: () => {
        this.loadingComplaint = false;
        this.showMessage('error', 'Failed to raise complaint');
      }
    });
  }

  getComplaintStatus() {
    if (!this.complaintId?.trim()) {
      this.showMessage('warning', 'Complaint ID is required');
      return;
    }
    if (!this.complaintStatusType) {
      this.showMessage('warning', 'Please select complaint type');
      return;
    }
    this.loadingStatus = true;
    this.http.post<any>(`${this.apiUrl1}/GetComplaintStatus`, {
      complaintId: this.complaintId,
      complaintType: this.complaintStatusType
    }).subscribe({
      next: (res) => {
        this.loadingStatus = false;
        this.complaintStatusResult = res;
        if (!res || Object.keys(res).length === 0) this.showMessage('warning', 'Complaint not found');
      },
      error: () => {
        this.loadingStatus = false;
        this.showMessage('error', 'Failed to get complaint status');
      }
    });
  }
}