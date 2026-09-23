import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HdfcCreatePaymentRequest {

  amount: number;

  customerId: string;

  customerEmail: string;

  customerPhone: string;

  firstName: string;

  lastName: string;
}


export interface HdfcCreatePaymentResponse {

  success: boolean;

  orderId: string;

  amount: number;

  paymentUrl: string;

  status: string;
}


export interface HdfcStatusResponse {

  success: boolean;

  orderId: string;

  status: string;

  hdfcResponse: any;
}


@Injectable({
  providedIn: 'root'
})
export class HdfcPaymentService {

  private apiUrl =
    'https://thefinocrat.com/api/HdfcPayment';


  constructor(
    private http: HttpClient
  ) {}


  // =====================================================
  // CREATE PAYMENT
  // =====================================================

  createPayment(
    request: HdfcCreatePaymentRequest
  ): Observable<HdfcCreatePaymentResponse> {

    return this.http.post<HdfcCreatePaymentResponse>(
      `${this.apiUrl}/create`,
      request
    );
  }


  // =====================================================
  // CHECK STATUS
  // =====================================================

  getPaymentStatus(
    orderId: string,
    customerId: string
  ): Observable<HdfcStatusResponse> {

    return this.http.get<HdfcStatusResponse>(
      `${this.apiUrl}/status/${encodeURIComponent(orderId)}`,
      {
        params: {
          customerId: customerId
        }
      }
    );
  }
}