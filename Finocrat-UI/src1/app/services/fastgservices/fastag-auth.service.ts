// fastag/services/fastag-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class FastagAuthService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Fastag/Login`, data);
  }

  signup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Fastag/Signup`, data);
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Fastag/ForgotPassword`, data);
  }

  saveToken(token: string, user: any) {
    localStorage.setItem('fastag_token', token);
    localStorage.setItem('fastag_user', JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem('fastag_token');
  }

  getUser(): any {
    const user = localStorage.getItem('fastag_user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('fastag_token');
    localStorage.removeItem('fastag_user');
  }
}