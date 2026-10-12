import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnyARecord } from 'dns';

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
    'https://edu.thefinocrat.com/api/HdfcPayment';

     private TAapiUrl =
    'https://localhost:7081/api/TAPay';


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

  
  createTAPayment(request: any): Observable<any> {

  return this.http.post<any>(
    `${this.TAapiUrl}/CreatePayment`,
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