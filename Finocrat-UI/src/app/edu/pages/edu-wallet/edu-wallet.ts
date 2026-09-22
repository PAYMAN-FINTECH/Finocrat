import { Component, OnInit } from '@angular/core';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CashfreeService } from '../../../services/mainservices/cashfreeService';
import { load } from '@cashfreepayments/cashfree-js';


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
  gateway = '';

  constructor(
    private razorService: RazorPaymentService,
    private router: Router,
    private toastr: ToastrService,
    private cashfreeService: CashfreeService
  ) {}

  ngOnInit(): void {
    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
      try {
        const decoded = JSON.parse(atob(data));
        this.model = decoded;
        this.userPhone = decoded.userPhone;
        this.gateway = decoded.category;
        console.log('Decoded payment data:', this.model);

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
    if(  this.gateway === 'REduction'){
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

    if(this.gateway === 'CEducation'){
      this.startCashfreePayment();
    }
  }

   async startCashfreePayment(): Promise<void> {

  this.isLoading = true;
  this.showFailureScreen = false;
  this.showSuccessScreen = false;

  const request = {
    amount: this.model.amount,
    mobile: this.model.mobile,
    name: this.model.name,
    email: this.model.email || null,
    selectedGateway: this.model.category,
    loggedInUserPhone: this.userPhone,
    cardnum: this.model.cardnum || ''
  };

  console.log('====================================');
  console.log('Cashfree Payment Started');
  console.log('Request:', request);
  console.log('Gateway:', this.gateway);
  console.log('====================================');

  this.cashfreeService.createOrder(request).subscribe({

    next: async (res: any) => {

      console.log('Cashfree Create Order Response:', res);

      /*
       * IMPORTANT:
       * Support both camelCase and snake_case response
       */

      const paymentSessionId =
        res?.paymentSessionId ||
        res?.payment_session_id;

      const orderId =
        res?.orderId ||
        res?.order_id;

      console.log('Payment Session ID:', paymentSessionId);
      console.log('Order ID:', orderId);

      if (!paymentSessionId || !orderId) {

        console.error(
          'Cashfree response does not contain payment session/order ID',
          res
        );

        this.isLoading = false;

        this.toastr.error(
          res?.message || 'Cashfree payment session was not created'
        );

        return;
      }

      try {

        console.log('Loading Cashfree SDK...');

        const cashfree = await load({
          mode: 'production'
        });

        if (!cashfree) {

          console.error('Cashfree SDK failed to load');

          this.isLoading = false;

          this.toastr.error(
            'Unable to load Cashfree payment gateway'
          );

          return;
        }

        console.log('Cashfree SDK loaded successfully');

        console.log(
          'Opening Cashfree checkout with session:',
          paymentSessionId
        );

        const result = await cashfree.checkout({

          paymentSessionId: paymentSessionId,

          redirectTarget: '_modal'

        });

        console.log(
          'Cashfree Checkout Result:',
          result
        );

        /*
         * IMPORTANT:
         * Checkout opening does NOT mean payment success.
         *
         * Verify order from backend after checkout.
         */

        this.verifyCashfreePayment(orderId);

      }
      catch (error: any) {

        console.error(
          'Cashfree Checkout Error:',
          error
        );

        this.isLoading = false;

        this.showFailureScreen = true;

        this.toastr.error(
          error?.message ||
          'Cashfree checkout failed'
        );

        setTimeout(() => {
          this.goToDashboard();
        }, 3000);
      }
    },

    error: (err) => {

      console.error(
        'Cashfree Create Order Error:',
        err
      );

      console.error(
        'Backend Error:',
        err?.error
      );

      this.isLoading = false;

      this.showFailureScreen = true;

      this.toastr.error(
        err?.error?.message ||
        'Unable to create Cashfree payment order'
      );

      setTimeout(() => {
        this.goToDashboard();
      }, 3000);
    }

  });
}

verifyCashfreePayment(orderId: string): void {

  console.log(
    'Verifying Cashfree payment:',
    orderId
  );

  this.cashfreeService.verifyPayment(orderId)
    .subscribe({

      next: (result: any) => {
        
        console.log(
          'Cashfree Verification Response:',
          result
        );

        this.isLoading = false;

          if (result.success === true) {
            this.showSuccessScreen = true;
            this.toastr.success('Payment Successful');
          } else {
            this.showFailureScreen = true;
            this.toastr.error('Payment Failed');
          }

          setTimeout(() => this.goToDashboard(), 3000);
      },

      error: (err) => {

        console.error(
          'Cashfree Verification Error:',
          err
        );

        this.isLoading = false;

        this.showFailureScreen = true;

        this.toastr.error(
          err?.error?.message ||
          'Payment failed'
        );

        setTimeout(() => {
          this.goToDashboard();
        }, 3000);
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