import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TokenService } from '../../../services/mainservices/token.service';
import { HomeService } from '../../../services/mainservices/home.service';
import { Router } from '@angular/router';
import { CreditcardService } from '../../../services/mainservices/creditcard.service';

declare var Razorpay: any;

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit {

  gateways: any[] = [];
  walletBalance: number = 0;
  ccBalance: number = 0;
  isLoading: boolean = false;
  showSuccessScreen: boolean = false;
selectedAmount: number | null = null;
amountInput: number | null = null;
allAmounts: number[] = [];
amountSearch = '';
dropdownOpen = false;

  model: any = {
    name: '',
    mobile: '',
    email: '',
    category: '',
    amount: null,
    cardnum: ''
  };

  username: string = '';
  userId: string = '';
  userPhone: string = '';

  binBankName: string = '';
  binLoading: boolean = false;
  binError: string = '';
  private lastBin: string = '';

  cardLimitMessage: string = '';
  cardLimitBlocked: boolean = false;
  private lastLimitCard: string = '';

  private checkCardLimit(cardNum: string): void {
    if (cardNum === this.lastLimitCard) return;
    this.lastLimitCard = cardNum;
    this.cardLimitMessage = '';
    this.cardLimitBlocked = false;

    this.homeService.checkDailyCardTransactionLimit(this.userPhone, cardNum).subscribe({
      next: (res: any) => {
        if (cardNum !== this.lastLimitCard) return;
        if (res && res.allowed === false) {
          this.cardLimitBlocked = true;
          this.cardLimitMessage = res.message || 'You have reached the maximum of 1 card transactions for today.';
        }
        this.cd.detectChanges();
      },
      error: () => {
        if (cardNum !== this.lastLimitCard) return;
        this.cardLimitMessage = '';
      }
    });
  }

  onCardNumberChange(value: string): void {
    const digits = (value || '').replace(/\D/g, '');
    if (digits.length === 16) {
      this.checkCardLimit(digits);
    } else if (digits.length < 16) {
      this.lastLimitCard = '';
      this.cardLimitMessage = '';
      this.cardLimitBlocked = false;
    }
    if (digits.length < 6) {
      this.lastBin = '';
      this.binBankName = '';
      this.binError = '';
      this.binLoading = false;
      return;
    }
    const bin = digits.substring(0, 6);
    if (bin === this.lastBin) return;
    this.lastBin = bin;
    this.binBankName = '';
    this.binError = '';
    this.binLoading = true;

    this.razorService.checkBin(bin).subscribe({
      next: (res) => {
        if (bin !== this.lastBin) return;
        this.binBankName = res?.bankName ?? res?.BankName ?? res?.bank ?? res?.data?.bankName ?? '';
        this.binLoading = false;
        if (!this.binBankName) this.binError = 'Bank not found for this BIN';
        this.cd.detectChanges();
      },
      error: () => {
        if (bin !== this.lastBin) return;
        this.binLoading = false;
        this.binError = 'Could not fetch bank name';
        this.cd.detectChanges();
      }
    });
  }

  constructor(
    private razorService: RazorPaymentService,
    private tokenService: TokenService,
    private homeService: HomeService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private ccService: CreditcardService
  ) {}

  ngOnInit(): void {
    const user = this.tokenService.getUser();

    if (user) {
      this.username = user.name;
      this.userId = user.userId;
      this.userPhone = user.userPhone;
    }

    this.loadGateways();
    this.loadWalletBalance();
    this.loadCCBalance();
  }

payInLimit: number = 0;
payInEnabled: boolean = false;

loadGateways(): void {
  this.razorService.getGateways(this.userPhone).subscribe({
    next: (res: any) => {
      this.payInEnabled = res.payInEnabled;
      this.payInLimit = res.payInLimit;
      this.gateways = res.gateways || [];
    },
    error: (err) => console.error('Gateway load error', err)
  });
}

onGatewayChange(gateway: string): void {
  this.allAmounts = [];
  this.amountSearch = '';
  this.dropdownOpen = false;
  this.selectedAmount = null;
  this.model.amount = null;
  if (gateway) this.loadAmounts(gateway);
}

loadAmounts(gateway: string): void {
  this.homeService.getSuggestedAmounts(this.userPhone, gateway).subscribe({
    next: (res: any) => {
      this.allAmounts = (res?.amounts || []).map(Number);
      this.cd.detectChanges();
    },
    error: () => this.allAmounts = []
  });
}

get filteredAmounts(): number[] {
  const term = this.amountSearch.trim();
  return term
    ? this.allAmounts.filter(a => a.toString().includes(term))
    : this.allAmounts;
}

onAmountSearch(): void {
  this.dropdownOpen = true;
  this.selectedAmount = null;
  this.model.amount = null;
}

selectAmount(amount: number): void {
  this.selectedAmount = amount;
  this.model.amount = amount;
  this.amountSearch = amount.toString();
  this.dropdownOpen = false;
}

closeDropdown(): void {
  setTimeout(() => {
    this.dropdownOpen = false;
    if (this.selectedAmount === null) this.amountSearch = '';
  }, 150);
}

  loadWalletBalance(): void {

    if (!this.userPhone) return;

    this.homeService.getWalletBalance(this.userPhone)
      .subscribe({
        next: (res: any) => {
          this.walletBalance = Number(res.balance) || 0;
          setTimeout(() => this.cd.detectChanges());
        },
        error: () => this.walletBalance = 0
      });
  }

  loadCCBalance(): void {

    if (!this.userPhone) return;

    this.ccService.getInstancepayWalletBalance()
      .subscribe({
        next: (res: any) => {
          this.ccBalance = Number(res.balance) || 0;
          setTimeout(() => this.cd.detectChanges());
        },
        error: () => this.ccBalance = 0
      });
  }

  refreshBalance(): void {
    this.loadWalletBalance();
    this.loadCCBalance();
  }

  goToDashboard(): void {
  this.showSuccessScreen = false;
  //window.location.reload();
  this.router.navigate(['/app/finhome']).then(() => {
    window.location.reload(); // reload dashboard & wallet data
  });
}

// 🔥 REDIRECT TO EDU DOMAIN
  addFunds(form: any): void {

    if (form.invalid || this.model.amount > 99999) {
      form.control.markAllAsTouched();
      return;
    }

    this.homeService.checkDailyCardTransactionLimit(this.userPhone,this.model.cardnum)
      .subscribe({
        next: (res: any) => {

          // -----------------------------------------
        // Backend says daily limit reached
        // -----------------------------------------
        if (!res.allowed) {

          this.isLoading = false;

          alert(
            res.message ||
            'You have reached the maximum of 2 card transactions for today.'
          );

          return;
        }

 const payload = {
      name: this.model.name,
      email: this.model.email,
      mobile: this.model.mobile,
      amount: this.model.amount,
      category: this.model.category,
      userPhone: this.userPhone,
      cardnum: this.model.cardnum || '',
      binBankName: this.model.binBankName || ''
    };

    const encodedData = btoa(JSON.stringify(payload));

    window.location.href =
      `https://edu.thefinocrat.com/edu/edu-wallet?data=${encodedData}`;
 

        },
      });

    }

  // addFunds(form: any): void {

  //   if (form.invalid || this.model.amount > 99999) {
  //     form.control.markAllAsTouched();
  //     return;
  //   }

  //   this.razorService.createOrder(this.model.amount)
  //     .subscribe({
  //       next: (res) => {
  //         debugger;
  //         this.isLoading = false;   // 👈 ADD THIS

  //         const options: any = {
  //           key: res.key,
  //           amount: res.amount * 100,
  //           currency: "INR",
  //           order_id: res.orderId,
  //           name: 'Finocrat',
  //           description: 'Add Wallet Funds',

  //           handler: (response: any) => {
  //             debugger;
  //              this.isLoading = true;

  //             const verifyPayload = {
  //               orderId: response.razorpay_order_id,
  //               paymentId: response.razorpay_payment_id,
  //               signature: response.razorpay_signature,
  //               amount: this.model.amount,
  //               mobile: this.model.mobile,
  //               selectedGateway: this.model.category,
  //               loggedInUserPhone: this.userPhone,
  //               cardHolderName: this.model.name,
  //               cardHolderCard: '',
  //               cardHolderMail: this.model.email || null

  //             };

  //             this.razorService.verifyPayment(verifyPayload)
  //               .subscribe({
  //                 next: (result) => {
  //                   debugger;

  //                   if (result.status == 'SUCCESS') {
  //                     alert("Payment Verified Successfully");
  //                     this.loadWalletBalance();
  //                     form.resetForm();
  //                     this.showSuccessScreen = true;
  //                           setTimeout(() => {
  //                             this.goToDashboard();
  //                            }, 3000);
  //                   } else {
  //                     alert("Payment Verification Failed");
  //                   }
  //                 },
  //                 error: () => {
  //                   alert("Payment Verification Failed");
  //                 }
  //               });
  //           },

  //           prefill: {
  //             name: this.model.name,
  //             email: this.model.email,
  //             contact: this.model.mobile
  //           },

  //           theme: { color: '#6A1B9A' }
  //         };

  //         const rzp = new Razorpay(options);
  //         rzp.open();
  //       },
  //       error: () => {
  //         this.isLoading = false;
  //         alert("Unable to create payment order");
  //       }
  //     });
  // }
}