

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment.prod';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {

  private baseUrl = environment.apiUrl


  step = 1;

  userId = '';
  otp = '';
  newPassword = '';

  loading = false;
  message = '';

  constructor(private http: HttpClient,
    private toastr: ToastrService,
     private router: Router,
  ) {}

  sendOtp() {
    this.loading = true;

    this.http.post(`${this.baseUrl}/auth/forgot-password/send-otp`, {
      userId: this.userId
    }).subscribe({
      next: () => {
        this.step = 2;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('User not found');
      }
    });
  }

  verifyOtp() {
    this.loading = true;

    this.http.post(`${this.baseUrl}/auth/forgot-password/verify-otp`, {
      userId: this.userId,
      otp: this.otp
    }).subscribe({
      next: () => {
        this.step = 3;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Invalid OTP');
      }
    });
  }

  resetPassword() {
    this.loading = true;

    this.http.post(`${this.baseUrl}/auth/forgot-password/reset`, {
      userId: this.userId,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('Password reset successful!');
         this.router.navigate(['/dashboard/login']);
       // this.step = 4;
      },
      error: () => {
        this.loading = false;
        alert('Failed');
      }
    });
  }
}

