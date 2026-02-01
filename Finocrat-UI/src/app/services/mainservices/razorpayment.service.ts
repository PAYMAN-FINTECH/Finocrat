import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RazorPaymentService {

  private api = 'https://edu.thefinocrat.com/api/RazorPayPayment';

  constructor(private http: HttpClient) {}

  createOrder(amount: number) {
    return this.http.post<any>(`${this.api}/create-order`, { amount });
  }

  verifyPayment(data: any) {
    return this.http.post<any>(`${this.api}/verify`, data);
  }

  getGateways() {
    return this.http.get<any[]>(`${this.api}/gateways`);
  }
}
