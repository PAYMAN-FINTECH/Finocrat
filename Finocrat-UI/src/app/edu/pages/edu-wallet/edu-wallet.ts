import { Component, OnInit } from '@angular/core';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

declare var Razorpay: any;

@Component({
  selector: 'app-edu-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edu-wallet.html',
  styleUrl: './edu-wallet.css',
})
export class EduWalletComponent implements OnInit {

  isLoading = false;
  showSuccessScreen = false;
  showFailureScreen = false;

  model: any = {};
  userPhone = '';

  constructor(
    private razorService: RazorPaymentService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        this.model = decoded;
        this.userPhone = decoded.userPhone;

        this.startPayment();
      } catch (e) {
        this.toastr.error('Invalid payment data');
      }
    } else {
      this.toastr.error('Missing payment data');
    }
  }

  startPayment(): void {
    this.isLoading = true;

    this.razorService.createOrder(this.model.amount)
      .subscribe({
        next: (res) => {

          const options: any = {
            key: res.key,
            amount: res.amount * 100,
            currency: "INR",
            order_id: res.orderId,

            name: 'Finocrat Edu',
            description: 'Add Wallet Funds',

            // ✅ FULL SCREEN EXPERIENCE
            modal: {
              backdropclose: false,
              escape: false,
              handleback: true,
              ondismiss: () => {
                this.isLoading = false;
              }
            },

            // ✅ ALLOW ONLY CARDS
            method: {
              netbanking: false,
              upi: false,
              wallet: false,
              emi: false,
              paylater: false
            },

            // ✅ PREFILL USER DATA
            prefill: {
              name: this.model.name,
              email: this.model.email,
              contact: this.model.mobile
            },

            theme: { color: '#6A1B9A' },

            // ✅ SUCCESS HANDLER
            handler: (response: any) => {
              const verifyPayload = {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                amount: this.model.amount,
                mobile: this.model.mobile,
                selectedGateway: this.model.category,
                loggedInUserPhone: this.userPhone,
                cardHolderName: this.model.name,
                cardHolderCard: '',
                cardHolderMail: this.model.email || null
              };

              this.verifyPayment(verifyPayload);
            }
          };

          const rzp = new Razorpay(options);

          // ✅ HANDLE FAILURE
          rzp.on('payment.failed', (response: any) => {
            console.error('Payment Failed:', response);

            this.isLoading = false;
            this.showFailureScreen = true;

            this.toastr.error('Payment Failed');

            setTimeout(() => this.goToDashboard(), 3000);
          });

          // ✅ OPEN FULL SCREEN
          rzp.open();
        },

        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.toastr.error("Unable to create payment order");
        }
      });
  }

  verifyPayment(payload: any): void {
    this.razorService.verifyPayment(payload)
      .subscribe({
        next: (result) => {

          this.isLoading = false;

          if (result.status === 'SUCCESS') {
            this.showSuccessScreen = true;
            this.toastr.success('Payment Successful');
          } else {
            this.showFailureScreen = true;
            this.toastr.error('Payment Verification Failed');
          }

          setTimeout(() => this.goToDashboard(), 3000);
        },

        error: (err) => {
          console.error(err);

          this.isLoading = false;
          this.showFailureScreen = true;

          this.toastr.error('Server Error');

          setTimeout(() => this.goToDashboard(), 3000);
        }
      });
  }

  goToDashboard(): void {
    window.location.href = "https://thefinocrat.com/app/finhome";
  }
}