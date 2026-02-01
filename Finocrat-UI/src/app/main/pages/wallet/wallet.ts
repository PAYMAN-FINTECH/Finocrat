import { Component, OnInit } from '@angular/core';
import { RazorPaymentService } from '../../../services/mainservices/razorpayment.service';
import { CommonModule } from '@angular/common';
import {  FormsModule, ReactiveFormsModule } from '@angular/forms';
declare var Razorpay: any;

@Component({
  selector: 'app-wallet',
  imports: [CommonModule,ReactiveFormsModule, FormsModule],
  standalone: true,
  templateUrl: './wallet.html',
  styleUrls: ['./wallet.css']
})
export class WalletComponent implements OnInit {

  gateways: any[] = [];
  model: any = {};

  constructor(private razorService: RazorPaymentService) {}

  ngOnInit() {
    this.loadGateways();
  }

  loadGateways() {
    this.razorService.getGateways().subscribe(res => {
      this.gateways = res;
    });
  }

  addFunds() {
    this.razorService.createOrder(this.model.amount)
      .subscribe(res => {

        const options = {
          key: res.key,
          amount: this.model.amount * 100,
          currency: 'INR',
          name: 'Finocrat',
          description: 'Add Wallet Funds',
          order_id: res.orderId,
          handler: (response: any) => {
            this.verifyPayment(response);
          },
          prefill: {
            name: this.model.name,
            email: this.model.email,
            contact: this.model.mobile
          },
          theme: { color: '#6A1B9A' }
        };

        new Razorpay(options).open();
      });
  }

  verifyPayment(response: any) {
    const payload = {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature
    };

    this.razorService.verifyPayment(payload)
      .subscribe(res => {
        if (res.success) {
          alert('Payment Successful');
        } else {
          alert('Payment Verification Failed');
        }
      });
  }
}
