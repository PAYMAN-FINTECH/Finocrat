import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {

  private api = 'https://thefinocrat.com/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(payload: any) {
    return this.http.post<any>(this.api, payload);
  }
   getWalletBalance(userPhone: string): Observable<any> {
    return this.http.get<any>(
      `${this.api}/wallet-balance`,
      {
        params: { userPhone: userPhone }
      }
    );
  }
}
