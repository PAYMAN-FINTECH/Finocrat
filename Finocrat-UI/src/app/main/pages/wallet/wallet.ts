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

  model: any = {
    name: '',
    mobile: '',
    email: '',
    category: '',
    amount: null
  };

  username: string = '';
  userId: string = '';
  userPhone: string = '';

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

    const payload = {
      name: this.model.name,
      email: this.model.email,
      mobile: this.model.mobile,
      amount: this.model.amount,
      category: this.model.category,
      userPhone: this.userPhone
    };

    const encodedData = btoa(JSON.stringify(payload));

    window.location.href =
      `https://edu.thefinocrat.com/edu/edu-wallet?data=${encodedData}`;
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