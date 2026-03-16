import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CreditcardService {

  private api = 'https://localhost:7081/api/CC';

  constructor(private http: HttpClient) { }

  // Get Credit Card Billers
  getCreditCardBillers() {
    return this.http.get(`${this.api}/CreditCardBillers`);
  }

  getInstancepayWalletBalance() {
    return this.http.get(`${this.api}/BalanceCheck`);
  }

  // Fetch Bill
  fetchBill(data: any) {
    return this.http.post(`${this.api}/FetchCreditCardBill`, data);
  }

  // Process Payment
  processPayment(data: any) {
    return this.http.post(`${this.api}/ProcessPayment`, data);
  }

}