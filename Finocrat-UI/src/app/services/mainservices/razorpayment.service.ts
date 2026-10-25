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

  getGateways(userPhone: string) {
  return this.http.get<any>(`${this.api}/gateways?userPhone=${userPhone}`);
}

  checkBin(bin: string) {
    return this.http.post<any>('https://thefinocrat.com/api/TAPay/CheckBin', { bin });
  }

  getQrStatus(userPhone: string) {
    return this.http.get<{ qrEnabled: boolean }>(`${this.api}/qr-status?userPhone=${userPhone}`);
  }

  submitQrReceipt(data: { userPhone: string; utr: string; amount: number; receiptDate: string; transactionType: string }) {
    return this.http.post<any>(`${this.api}/qr-receipt`, data);
  }

  getQrRequests() {
    return this.http.get<any[]>(`${this.api}/qr-requests`);
  }

  reviewQrReceipt(id: string, approve: boolean) {
    return this.http.post<any>(`${this.api}/qr-review`, { id, approve });
  }

  
}
