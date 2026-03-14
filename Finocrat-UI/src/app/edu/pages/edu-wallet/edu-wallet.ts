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

  constructor(private razorService: RazorPaymentService, private router: Router, private toastr: ToastrService,) {}

  ngOnInit(): void {

    const params = new URLSearchParams(window.location.search);
    const data = params.get('data');

    if (data) {
      const decoded = JSON.parse(atob(data));

      this.model = decoded;
      this.userPhone = decoded.userPhone;

      this.startPayment();
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
            redirect: true,

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

              this.razorService.verifyPayment(verifyPayload)
                .subscribe({
                  next: (result) => {
                    if (result.status === 'SUCCESS') {
                      //this.isLoading = false;
                      this.showSuccessScreen = true;
                                              setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                    } else {
                      this.showFailureScreen = true;
                       setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                    }
                  },
                  error: () => {
                    this.isLoading = false;
                    this.showFailureScreen = true;
                     setTimeout(() => {
                              this.goToDashboard();
                             }, 3000);
                  }
                });
            },

            modal: {
              ondismiss: () => {
                this.isLoading = false;
              }
            },

            prefill: {
              name: this.model.name,
              email: this.model.email,
              contact: this.model.mobile
            },

            theme: { color: '#6A1B9A' }
          };

          const rzp = new Razorpay(options);
          rzp.open();
        },
        error: () => {
          this.isLoading = false;
          alert("Unable to create payment order");
        }
      });
  }

goToDashboard(): void {
  this.showSuccessScreen = false;
  //window.location.reload();
 window.location.href ="https://thefinocrat.com/app/finhome";
}
}