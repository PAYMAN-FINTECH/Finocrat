import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class HomeService {

  private api = 'https://thefinocrat.com/api/dashboard';
  private baseUrl = environment.apiUrl;

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
    return this.http.get(`${this.baseUrl}/FUserLookup/users`);
  }

  // ============================
  // USER LOOKUP
  // ============================
  getUserLookup(userPhone: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/FUserLookup/${userPhone}`);
  }

  // ============================
  // SAVE USER LOOKUP
  // ============================
  saveUserLookup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/FUserLookup`, data);
  }

  // ============================
  // DELETE USER LOOKUP (OPTIONAL)
  // ============================
  deleteUserLookup(userId: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/FUserLookup/${userId}`);
  }
}
