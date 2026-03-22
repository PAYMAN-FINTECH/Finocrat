import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class HomeService {

  private api = 'https://thefinocrat.com/api/dashboard';
  private fuserlookupapi = 'https://localhost:7081/api/FUserLookup';

  constructor(private http: HttpClient) {}

  // ============================
  // DASHBOARD
  // ============================
  getStats(payload: any): Observable<any> {
    return this.http.post<any>(this.api, payload);
  }

  // ============================
  // WALLET BALANCE
  // ============================
  getWalletBalance(userPhone: string): Observable<any> {
    const params = new HttpParams().set('userPhone', userPhone);

    return this.http.get<any>(`${this.api}/wallet-balance`, { params });
  }

  // ============================
  // 🔥 GET USER LIST (NEW)
  // ============================
  getUsers(): Observable<any> {
    return this.http.get(`${this.fuserlookupapi}/users`);
  }

  // ============================
  // USER LOOKUP
  // ============================
  getUserLookup(userPhone: string): Observable<any> {
    return this.http.get(`${this.fuserlookupapi}/${userPhone}`);
  }

  // ============================
  // SAVE USER LOOKUP
  // ============================
  saveUserLookup(data: any): Observable<any> {
    return this.http.post(`${this.fuserlookupapi}`, data);
  }

  // ============================
  // DELETE USER LOOKUP (OPTIONAL)
  // ============================
  deleteUserLookup(userId: string): Observable<any> {
    return this.http.delete(`${this.fuserlookupapi}/${userId}`);
  }
}
