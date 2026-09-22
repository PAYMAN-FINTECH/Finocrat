import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CashfreeService {

  private apiUrl =
    'https://thefinocrat.com/api/CashfreePayment';

  constructor(
    private http: HttpClient
  ) {}

  // Create Cashfree Order
  createOrder(data: any): Observable<any> {

    return this.http.post<any>(
      `${this.apiUrl}/CreateOrder`,
      data
    );
  }


  // Verify Cashfree Payment
 verifyPayment(orderId: string) {

  return this.http.get<any>(
    `${this.apiUrl}/verify/${orderId}`
  );
}

}