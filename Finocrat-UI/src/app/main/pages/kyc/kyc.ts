import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../../../services/mainservices/token.service';
import { environment } from '../../../../environments/environment.prod';

@Component({
  selector: 'app-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kyc.html',
  styleUrls: ['./kyc.css']
})
export class KycComponent implements OnInit {

  private baseUrl = environment.apiUrl

  step = 1;

  aadhaar = '';
  otp = '';
  pan = '';

  refId = '';
  phone = '';

  aadhaarFront: File | null = null;
  aadhaarBack: File | null = null;
  panFile: File | null = null;

  loading = false;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    const user = this.tokenService.getUser();
    if (user) {
      this.phone = user.userPhone;
    }
  }

  // ================= SEND OTP =================
  sendOtp() {

    if (this.aadhaar.length !== 12) {
      alert('Invalid Aadhaar');
      return;
    }

    this.loading = true;

    this.http.post<any>(`${this.baseUrl}/Kyc/send-otp`, {
      phone: this.phone,
      adharNumber: this.aadhaar
    }).subscribe({
      next: (res) => {
        this.refId = res.refId;
        this.step = 2;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('OTP Failed');
      }
    });
  }

  // ================= VERIFY OTP =================
  verifyOtp() {

    this.loading = true;

    this.http.post(`${this.baseUrl}/Kyc/verify-otp`, {
      phone: this.phone,
      refId: this.refId,
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

  // ================= VERIFY PAN =================
  verifyPan() {

    this.loading = true;

    this.http.post(`${this.baseUrl}/Kyc/verify-pan`, {
      phone: this.phone,
      panNumber: this.pan
    }).subscribe({
      next: () => {
        alert('PAN Verified ✅');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        alert('Invalid PAN');
      }
    });
  }

  // ================= FILE HANDLING =================
  onFileChange(event: any, type: string) {
    const file = event.target.files[0];

    if (type === 'front') this.aadhaarFront = file;
    if (type === 'back') this.aadhaarBack = file;
    if (type === 'pan') this.panFile = file;
  }

  // ================= UPLOAD DOCS =================
  uploadDocs() {

    if (!this.aadhaarFront || !this.aadhaarBack || !this.panFile) {
      alert('Upload all documents');
      return;
    }

    const formData = new FormData();
    formData.append('aadhaarFront', this.aadhaarFront);
    formData.append('aadhaarBack', this.aadhaarBack);
    formData.append('panFile', this.panFile);
    formData.append('phone', this.phone);

    this.loading = true;

    this.http.post(`${this.baseUrl}/Kyc/upload-docs`, formData)
      .subscribe({
        next: () => {
          this.loading = false;
          this.submitKyc();
        },
        error: () => {
          this.loading = false;
          alert('Upload failed');
        }
      });
  }

  // ================= FINAL SUBMIT =================
  submitKyc() {

    this.loading = true;

    this.http.post(`${this.baseUrl}/Kyc/submit`, {
      phone: this.phone
    }).subscribe({
      next: () => {
        this.loading = false;
        this.step = 4;
      },
      error: () => {
        this.loading = false;
        alert('Submit failed');
      }
    });
  }
}
