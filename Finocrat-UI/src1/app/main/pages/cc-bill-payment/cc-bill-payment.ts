import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TokenService } from '../../../services/mainservices/token.service';
import { CreditcardService } from '../../../services/mainservices/creditcard.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { HomeService } from '../../../services/mainservices/home.service';

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
  
  // PIN Verification Modal
  showPinModal = false;
  pin = '';
  pinError = '';
  pinAttempts = 0;
  maxPinAttempts = 3;
  pendingPaymentPayload: any = null;

  model: any = {
    billerId: '',
    last4: '',
    cardMobile: '',
    amount: '',

    consumerName: '',
    dueDate: '',
    param1: '',
    param2: '',
    enquiryReferenceId: '',
    paymentMode: 'Cash'
  };

  constructor(
    private tokenService: TokenService,
    private ccService: CreditcardService,
    private toastr: ToastrService,
    private router: Router,
    private homeService: HomeService
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
    
    // Block back button
    history.pushState(null, '', location.href);
    window.onpopstate = () => {
      if (this.showSuccessScreen) {
        this.goHome();
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
      consumerName: '',
      dueDate: '',
      param1: '',
      param2: '',
      enquiryReferenceId: '',
      paymentMode: 'Cash'
    };
    this.billDetails = null;
  }

  closePopup() {
    this.selectedBiller = null;
    this.showPinModal = false;
    this.pin = '';
    this.pinError = '';
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

  // Open PIN verification modal before payment
  processPayment() {
    if (!this.model.amount || this.model.amount <= 0) {
      this.toastr.warning('Please enter valid amount');
      return;
    }

    // Prepare payment payload
    this.pendingPaymentPayload = {
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

    // Show PIN modal instead of processing directly
    this.showPinModal = true;
    this.pin = '';
    this.pinError = '';
    this.focusPinInput();
  }

  // Verify PIN and process payment
  verifyPinAndPay() {
    if (!this.pin || this.pin.length !== 4) {
      this.pinError = 'Please enter 4-digit PIN';
      return;
    }

    this.isLoading = true;
    this.pinError = '';

    const payload = {
      UserPhone: this.userPhone,
      Pin: this.pin
    };

    this.homeService.verifyPin(payload).subscribe({
      next: (response) => {
        console.log("✅ PIN VERIFIED - Processing payment");
        this.isLoading = false;
        this.showPinModal = false;
        this.pinAttempts = 0;
        
        // Proceed with payment
        this.executePayment();
      },
      error: (err) => {
        console.error('PIN verification error:', err);
        this.isLoading = false;
        this.pinAttempts++;
        
        if (this.pinAttempts >= this.maxPinAttempts) {
          this.pinError = `Too many failed attempts. Payment cancelled.`;
          this.toastr.error('Too many failed PIN attempts. Payment cancelled.');
          this.showPinModal = false;
          this.pin = '';
          this.pinAttempts = 0;
          return;
        }
        
        this.pinError = `Wrong PIN. ${this.maxPinAttempts - this.pinAttempts} attempt(s) left`;
        this.pin = '';
        this.focusPinInput();
      }
    });
  }

  // Execute actual payment after PIN verification
  executePayment() {
    this.isLoading = true;

    this.ccService.processPayment(this.pendingPaymentPayload).subscribe({
      next: (res: any) => {
        this.isLoading = false;

        if (res.success === true) {
          this.showSuccessScreen = true;
          this.pendingPaymentPayload = null;
          
          // Auto redirect after 3 seconds
          setTimeout(() => {
            this.goHome();
          }, 3000);
          this.closePopup();
        } else {
          this.toastr.error(res.message || 'Payment failed');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Payment Error');
      }
    });
  }

  focusPinInput() {
    setTimeout(() => {
      const pinInput = document.getElementById('pin-input-field');
      if (pinInput) {
        pinInput.focus();
      }
    }, 100);
  }

  // Handle PIN input from keypad
  onPinInput(value: string) {
    if (this.pin.length < 4) {
      this.pin += value;
      this.pinError = '';
      
      if (this.pin.length === 4) {
        this.verifyPinAndPay();
      }
    }
  }

  deletePin() {
    this.pin = this.pin.slice(0, -1);
  }

  closePinModal() {
    this.showPinModal = false;
    this.pin = '';
    this.pinError = '';
    this.pendingPaymentPayload = null;
  }
}