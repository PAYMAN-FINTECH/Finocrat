import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TokenService } from '../../../services/mainservices/token.service';
import { CreditcardService } from '../../../services/mainservices/creditcard.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cc-bill-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cc-bill-payment.html',
  styleUrls: ['./cc-bill-payment.css']
})
export class CcBillPaymentComponent implements OnInit {

  billers: any[] = [];
  filteredBillers: any[] = [];

  searchText = '';

  selectedBiller: any = null;
  billDetails: any = null;

  userPhone = '';

  isLoading = false;
  showSuccessScreen = false;

  model: any = {
    billerId: '',
    last4: '',
    cardMobile: '',
    amount: ''
  };

  constructor(
    private tokenService: TokenService,
    private ccService: CreditcardService,
    private toastr: ToastrService,
    private router: Router,
  ) {}

  goHome() {
  this.router.navigate(['/app/finhome'], { replaceUrl: true });
}

  ngOnInit(): void {

    const user = this.tokenService.getUser();
    if (user) {
      this.userPhone = user.userPhone;
    }

    this.loadBillers();
    // 🔥 BLOCK BACK
  history.pushState(null, '', location.href);
  window.onpopstate = () => {
    if (this.showSuccessScreen) {
      this.goHome(); // force redirect
    }
  };
  }

  loadBillers() {
    this.ccService.getCreditCardBillers().subscribe((res: any) => {
      this.billers = res.billers || [];
      this.filteredBillers = this.billers;
    });
  }

  onSearch() {
    const val = this.searchText.toLowerCase();
    this.filteredBillers = this.billers.filter(x =>
      x.billerName.toLowerCase().includes(val)
    );
  }

  openPopup(b: any) {
    this.selectedBiller = b;
    this.model = {
      billerId: b.billerId,
      last4: '',
      cardMobile: '',
      amount: '',

      // 🔥 hidden fields
  consumerName: '',
  dueDate: '',
  param1: '',
  param2: '',
  enquiryReferenceId: '',
  paymentMode:'Cash'
    };
    this.billDetails = null;
  }

  closePopup() {
    this.selectedBiller = null;
  }
  closeSuccess() {
    this.showSuccessScreen = false;
    this.closePopup();
    this.router.navigate(['/app/finhome']);
  }

  fetchBill() {

  if (this.model.last4.length !== 4) {
    this.toastr.error('Enter valid last 4 digits');
    return;
  }

  this.isLoading = true;

  const payload = {
    BillerId: this.model.billerId,
    CreditCardLast4: this.model.last4,
    RegisteredMobile: this.model.cardMobile,
    CustomerMobile: this.userPhone,
    UserPhone: this.userPhone,
    ServiceNumber: this.model.last4,
    Category: "Credit Card"
  };

  this.ccService.fetchBill(payload).subscribe({
    next: (res: any) => {
      this.isLoading = false;

      if (!res.success) {
        this.toastr.error('Failed to fetch bill');
        return;
      }

      this.billDetails = res;
      this.model.amount = res.totalAmount;

      this.model.consumerName = res.consumerName;
      this.model.dueDate = res.dueDate;
      this.model.param1 = res.param1;
      this.model.param2 = res.param2;
      this.model.enquiryReferenceId = res.enquiryReferenceId;
    },
    error: () => {
      this.isLoading = false;
      this.toastr.error('Fetch failed');
    }
  });
}


  processPayment() {

    this.isLoading = true;

    const payload = {

    BillerId: this.model.billerId,

    CustomerMobile: this.userPhone,
    Phone: this.userPhone,

    Amount: Number(this.model.amount),

    PaymentMode: this.model.paymentMode,

    EnquiryReferenceId: this.model.enquiryReferenceId,

    Param1: this.model.param1,
    Param2: this.model.param2,

    LastFourDigits: this.model.last4,

    customerName: this.model.consumerName,

    holderMobile: this.model.cardMobile,

    Device: "Web"
  };


    this.ccService.processPayment(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success === true) {
          this.showSuccessScreen = true;

        // 🔥 AUTO REDIRECT AFTER 3 SEC
        setTimeout(() => {
          this.goHome();
        }, 3000);
          this.closePopup();
        } else {
          this.toastr.error('Payment Failed ❌');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Payment Error');
      }
    });
  }
}