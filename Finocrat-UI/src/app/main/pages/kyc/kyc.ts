import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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

  // ViewChild references
  @ViewChild('frontInput') frontInput!: ElementRef;
  @ViewChild('backInput') backInput!: ElementRef;
  @ViewChild('panInput') panInput!: ElementRef;

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
    private router: Router
  ) {}

  ngOnInit() {
    const user = this.tokenService.getUser();
    if (user) {
      this.phone = user.userPhone;
      console.log('User phone:', this.phone);
    }
  }

  // ================= OPEN FILE SELECTOR =================
  openFileSelector(type: string) {
    if (type === 'frontInput' && this.frontInput) {
      this.frontInput.nativeElement.click();
    } else if (type === 'backInput' && this.backInput) {
      this.backInput.nativeElement.click();
    } else if (type === 'panInput' && this.panInput) {
      this.panInput.nativeElement.click();
    }
  }

  // ================= SEND OTP =================
  sendOtp() {
    if (this.aadhaar.length !== 12) {
      alert('Invalid Aadhaar');
      return;
    }

    this.loading = true;

    const requestModel = {
      phone: this.phone,
      adharNumber: this.aadhaar
    };

    this.http.post<any>(`${this.baseUrl}/Kyc/send-otp`, requestModel).subscribe({
      next: (res) => {
        this.refId = res.refId;
        this.step = 2;
        this.loading = false;
      },
      error: (err) => {
        console.error('Send OTP error:', err);
        this.loading = false;
        alert('OTP Failed');
      }
    });
  }

  // ================= VERIFY OTP =================
  verifyOtp() {
    this.loading = true;

    const requestModel = {
      phone: this.phone,
      refId: this.refId,
      otp: this.otp
    };

    this.http.post(`${this.baseUrl}/Kyc/verify-otp`, requestModel).subscribe({
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

    const requestModel = {
      phone: this.phone,
      panNumber: this.pan
    };

    this.http.post(`${this.baseUrl}/Kyc/verify-pan`, requestModel).subscribe({
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
    if (file) {
      console.log(`File selected for ${type}:`, file.name);
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        event.target.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload JPG, PNG, or PDF file');
        event.target.value = '';
        return;
      }

      if (type === 'front') {
        this.aadhaarFront = file;
      } else if (type === 'back') {
        this.aadhaarBack = file;
      } else if (type === 'pan') {
        this.panFile = file;
      }
    }
  }

  // ================= UPLOAD DOCS =================
  uploadDocs() {
    console.log('Upload Docs called');
    
    if (!this.aadhaarFront) {
      alert('Please upload Aadhaar Front');
      return;
    }
    if (!this.aadhaarBack) {
      alert('Please upload Aadhaar Back');
      return;
    }
    if (!this.panFile) {
      alert('Please upload PAN Card');
      return;
    }
    if (!this.pan) {
      alert('Please enter PAN Number');
      return;
    }

    const formData = new FormData();
    
    // Append files
    formData.append('aadhaarFront', this.aadhaarFront);
    formData.append('aadhaarBack', this.aadhaarBack);
    formData.append('panFile', this.panFile);
    
    // Append model properties as form fields
    formData.append('phone', this.phone);
    formData.append('panNumber', this.pan);
    formData.append('aadhaarNumber', this.aadhaar);

    this.loading = true;

    this.http.post(`${this.baseUrl}/Kyc/upload-docs`, formData)
      .subscribe({
        next: (response) => {
          console.log('Upload success:', response);
          this.loading = false;
          this.submitKyc();
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.loading = false;
          alert('Upload failed: ' + (error.error?.message || 'Please try again'));
        }
      });
  }

  // ================= FINAL SUBMIT =================
  submitKyc() {
    this.loading = true;

    const requestModel = {
      phone: this.phone
    };

    this.http.post(`${this.baseUrl}/Kyc/submit`, requestModel).subscribe({
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

  // ================= GO TO DASHBOARD =================
  goToDashboard() {
    this.router.navigate(['/dashboard/login']);
  }
}