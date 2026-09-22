// services/mainservices/travel-auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TravelAuthService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Travel/Login`, data);
  }

  signup(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/Travel/Signup`, data);
  }

  forgotPassword(data: { email: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/Travel/ForgotPassword`, data);
  }

  saveToken(token: string, user: any) {
    localStorage.setItem('travel_token', token);
    localStorage.setItem('travel_user', JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem('travel_token');
  }

  getUser(): any {
    const user = localStorage.getItem('travel_user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem('travel_token');
    localStorage.removeItem('travel_user');
  }
}