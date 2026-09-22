import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-payment-status',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-status.html',
  styleUrls: ['./payment-status.css']
})
export class PaymentStatusComponent implements OnInit {

  isLoading = true;
  isSuccess = false;
  isFailed = false;

  paymentId: string | null = '';
  linkId: string | null = '';
  status: string | null = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
  const params = new URLSearchParams(window.location.search);

  const paymentId = params.get('razorpay_payment_id');
  const linkId = params.get('razorpay_payment_link_id');
  const status = params.get('razorpay_payment_link_status');

  if (!paymentId) {
    alert("Invalid Payment");
    return;
  }

  this.http.get<any>(
    `https://localhost:7081/api/RazorPayPayment/verify-payment?razorpay_payment_id=${paymentId}&razorpay_payment_link_id=${linkId}&razorpay_payment_link_status=${status}`
  ).subscribe(res => {

    if (res.status === 'SUCCESS') {
      alert("Payment Success");
    } else {
      alert("Payment Failed");
    }

    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 3000);
  });
}

  handleFailure(message: string) {
    this.isLoading = false;
    this.isFailed = true;
    this.toastr.error(message);

    setTimeout(() => {
      this.router.navigate(['/dashboard']);
    }, 3000);
  }
}