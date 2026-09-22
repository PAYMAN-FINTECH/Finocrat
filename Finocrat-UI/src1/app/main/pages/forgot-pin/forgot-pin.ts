// main/pages/forgot-pin/forgot-pin.component.ts
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment.prod';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-forgot-pin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-pin.html',
  styleUrls: ['./forgot-pin.css']
})
export class ForgotPinComponent {

  private baseUrl = environment.apiUrl;

  step = 1; // 1: Enter UserId, 2: OTP Verification
  userId = '';
  otp = '';
  isLoading = false;
  errorMessage = '';
  timer = 0;
  timerInterval: any;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private tokenService: TokenService
  ) {}

  // Step 1: Send OTP
  sendOtp() {
    if (!this.userId) {
      this.toastr.warning('Please enter your registered phone number or email');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${this.baseUrl}/auth/forgot-pin/send-otp`, {
      userId: this.userId
    }).subscribe({
      next: (response: any) => {
        console.log('OTP sent successfully', response);
        this.toastr.success('OTP sent to your registered email/phone');
        this.step = 2;
        this.isLoading = false;
        this.startTimer(60);
      },
      error: (err) => {
        console.error('Send OTP error:', err);
        this.errorMessage = err.error?.message || 'User not found. Please check your credentials.';
        this.toastr.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Step 2: Verify OTP and redirect to Set PIN
  verifyOtp() {
    if (!this.otp || this.otp.length < 4) {
      this.toastr.warning('Please enter valid OTP');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.post(`${this.baseUrl}/auth/forgot-pin/verify-otp`, {
      userId: this.userId,
      otp: this.otp
    }).subscribe({
      next: (response: any) => {
        console.log('OTP verified successfully', response);
        this.toastr.success('OTP verified! Please set your new PIN.');
        this.isLoading = false;
        this.stopTimer();
        
        // Store user ID in session to use in SetPinComponent
        sessionStorage.setItem('resetPinUserId', this.userId);
        
        // Navigate to Set PIN component
        this.router.navigate(['/dashboard/set-pin'], { 
          queryParams: { isReset: 'true' }
        });
      },
      error: (err) => {
        console.error('Verify OTP error:', err);
        this.errorMessage = err.error?.message || 'Invalid OTP. Please try again.';
        this.toastr.error(this.errorMessage);
        this.isLoading = false;
      }
    });
  }

  // Resend OTP
  resendOtp() {
    if (this.timer > 0) {
      this.toastr.warning(`Please wait ${this.timer} seconds before resending`);
      return;
    }
    this.sendOtp();
  }

  // Timer for OTP resend
  startTimer(seconds: number) {
    this.timer = seconds;
    this.timerInterval = setInterval(() => {
      if (this.timer > 0) {
        this.timer--;
      } else {
        this.stopTimer();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Go back
  goBack() {
    if (this.step > 1) {
      this.step--;
      this.errorMessage = '';
      this.otp = '';
      this.stopTimer();
    } else {
      this.router.navigate(['/dashboard/login']);
    }
  }

  goToLogin() {
    this.router.navigate(['/dashboard/login']);
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}