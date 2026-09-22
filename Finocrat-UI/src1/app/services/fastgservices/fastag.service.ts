// services/mainservices/fastag.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class FastagService {
  private baseUrl = environment.apiUrl ;

  constructor(private http: HttpClient) {}

  /**
   * Get all FASTag providers/billers
   */
  getFastTagBillers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/FasTag/FastTagBillers`);
  }

  /**
   * Fetch bill for a vehicle
   * @param payload - { creditCardLast4, customerMobile, billerId }
   */
  fetchBill(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/FasTag/FetchCreditCardBill`, payload);
  }

  /**
   * Initiate payment
   * @param payload - { orderId, amount, actionType, email, phone, custmobile, custcard, custname }
   */
  initiatePayment(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/FasTag/Initiate`, null, {
      params: payload
    });
  }

  /**
   * Confirm payment after Razorpay response
   * @param payload - { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount, enterCustomerNumber }
   */
  confirmPayment(payload: any): Observable<any> {
    const params = new HttpParams()
      .set('razorpay_payment_id', payload.razorpay_payment_id)
      .set('razorpay_order_id', payload.razorpay_order_id)
      .set('razorpay_signature', payload.razorpay_signature)
      .set('amount', payload.amount)
      .set('enterCustomerNumber', payload.enterCustomerNumber);
    
    return this.http.get(`${this.baseUrl}/PayMan/ConfirmPayment`, { params });
  }

  /**
   * Process FASTag bill payment
   * @param payload - Payment details
   */
  processPayment(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/FasTag/ProcessPayment`, payload);
  }

  /**
   * Get recharge history
   */
  getHistory(): Observable<any> {
    return this.http.get(`${this.baseUrl}/FasTag/History`);
  }

  /**
   * Get payment status
   * @param transactionId - Transaction ID
   */
  getPaymentStatus(transactionId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/FasTag/PayStatus`, {
      params: { transactionId }
    });
  }
}