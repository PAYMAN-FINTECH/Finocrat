import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KycService {

  private baseUrl = 'https://thefinocrat.com/api/Kyc';

  constructor(private http: HttpClient) {}

  /* ================================
     1. SEND AADHAAR OTP
  ================================= */
  sendAadhaarOtp(aadhaarNumber: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-otp`, {
      aadhaarNumber: aadhaarNumber
    });
  }

  /* ================================
     2. VERIFY AADHAAR OTP
  ================================= */
  verifyAadhaarOtp(aadhaarNumber: string, otp: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-otp`, {
      aadhaarNumber: aadhaarNumber,
      otp: otp
    });
  }

  /* ================================
     3. VERIFY PAN
  ================================= */
  verifyPan(panNumber: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/verify-pan`, {
      panNumber: panNumber
    });
  }

  /* ================================
     4. UPLOAD DOCUMENTS (Aadhaar + PAN)
  ================================= */
  uploadDocuments(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/upload-docs`, formData);
  }

  /* ================================
     5. FINAL SUBMIT KYC
  ================================= */
  submitKyc(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit`, data);
  }

}
