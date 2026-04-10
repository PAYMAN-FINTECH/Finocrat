import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PayInService {

  private api = 'https://thefinocrat.com/api/PayIn/history';
  private payoutapi = 'https://thefinocrat.com/api/PayIn/payouthistory';
  private passbookapi = 'https://thefinocrat.com/api/PayIn';
  

  constructor(private http: HttpClient) {}

  getHistory(fromDate?: string, toDate?: string, userPhone?: string) {

    let params = new HttpParams();

    if (fromDate)
      params = params.set('fromDate', fromDate);

    if (toDate)
      params = params.set('toDate', toDate);

    if (userPhone)
      params = params.set('userPhone', userPhone);

    return this.http.get<any[]>(this.api, { params });
  }


getPayoutHistory(fromDate?: string, toDate?: string, userPhone?: string) {

    let params = new HttpParams();

    if (fromDate)
      params = params.set('fromDate', fromDate);

    if (toDate)
      params = params.set('toDate', toDate);

    if (userPhone)
      params = params.set('userPhone', userPhone);

    return this.http.get<any[]>(this.payoutapi, { params });
  }

  getPassbook(mobile: string, fromDate?: string, toDate?: string) {
  return this.http.get<any[]>(
    `${this.passbookapi}/GetPassbook?mobile=${mobile}&fromDate=${fromDate || ''}&toDate=${toDate || ''}`
  );
}

}