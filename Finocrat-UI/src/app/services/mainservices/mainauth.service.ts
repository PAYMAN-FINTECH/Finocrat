import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class MainAuthService {

  private api = 'https://thefinocrat.com/api/auth/login';
  private tokenKey = 'main_token';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  // 🔹 LOGIN API CALL
  login(data: any) {
    return this.http.post<any>(this.api, data);
  }

  // 🔹 SAVE TOKEN (Always localStorage for multi-tab support)
  saveSession(token: string) {
    localStorage.setItem(this.tokenKey, token);
  }

  // 🔹 GET TOKEN
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 🔹 CHECK LOGIN (With Expiry Validation)
  isLoggedIn(): boolean {
    const token = this.getToken();
    //alert(token);
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp;

      if (!expiry) return false;

      const now = Math.floor(Date.now() / 1000);
      return now < expiry;
    } catch {
      return false;
    }
  }

  // 🔹 LOGOUT
  logout() {
    localStorage.removeItem(this.tokenKey);
    this.router.navigateByUrl('/dashboard');
  }
}