import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TokenService } from '../../../services/mainservices/token.service';
import { HomeService } from '../../../services/mainservices/home.service';
import { CreditcardService } from '../../../services/mainservices/creditcard.service';

@Component({
  selector: 'app-cc-bill-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cc-bill-payment.html',
  styleUrls: ['./cc-bill-payment.css']
})

export class CcBillPaymentComponent implements OnInit {

  walletBalance: number = 0;
  billers: any[] = [];
  billDetails: any = null;

  isLoading = false;
  showSuccessScreen = false;

  userPhone: string = '';
  username: string = '';

  model: any = {
    billerId: '',
    cardNumber: '',
    amount: 0
  };

  constructor(
    private tokenService: TokenService,
    private homeService: HomeService,
    private ccService: CreditcardService,
    private cd: ChangeDetectorRef,
    private router: Router
  ) { }

  ngOnInit(): void {

    const user = this.tokenService.getUser();

    if (user) {
      this.userPhone = user.userPhone;
      this.username = user.name;
    }

    this.loadInstancePayWalletBalance();

    //this.loadWalletBalance();
    this.loadBillers();
  }


  // LOAD WALLET BALANCE
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

  // LOAD CREDIT CARD BILLERS
  loadInstancePayWalletBalance(): void {

    this.ccService.getInstancepayWalletBalance()
      .subscribe({
        next: (res: any) => {
          debugger;
          this.billers = res || [];
        },
        error: (err) => console.error("Biller load error", err)
      });
  }



  // LOAD CREDIT CARD BILLERS
  loadBillers(): void {

    this.ccService.getCreditCardBillers()
      .subscribe({
        next: (res: any) => {
          debugger;
          this.billers = res || [];
        },
        error: (err) => console.error("Biller load error", err)
      });
  }


  // FETCH BILL
  fetchBill(): void {

    if (!this.model.billerId || !this.model.cardNumber) {
      alert("Enter card number");
      return;
    }

    this.isLoading = true;

    const payload = {
      billerId: this.model.billerId,
      cardNumber: this.model.cardNumber
    };

    this.ccService.fetchBill(payload)
      .subscribe({
        next: (res: any) => {
          this.billDetails = res;
          this.model.amount = res.amount;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          alert("Unable to fetch bill");
        }
      });
  }


  // PROCESS PAYMENT
  processPayment(): void {

    if (!this.model.amount) {
      alert("Invalid amount");
      return;
    }

    this.isLoading = true;

    const payload = {
      billerId: this.model.billerId,
      cardNumber: this.model.cardNumber,
      amount: this.model.amount,
      mobile: this.userPhone
    };

    this.ccService.processPayment(payload)
      .subscribe({
        next: (res: any) => {

          this.isLoading = false;

          if (res.status === "SUCCESS") {
            this.showSuccessScreen = true;
            this.loadWalletBalance();

            setTimeout(() => {
              this.goToDashboard();
            }, 3000);
          }
          else {
            alert("Payment Failed");
          }
        },
        error: () => {
          this.isLoading = false;
          alert("Payment Error");
        }
      });

  }


  goToDashboard(): void {

    this.showSuccessScreen = false;

    this.router.navigate(['/app/finhome']).then(() => {
      window.location.reload();
    });
  }

}