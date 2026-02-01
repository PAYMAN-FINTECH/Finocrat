import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class MainAuthService {

  private api = 'https://thefinocrat.com/api/auth/login';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  login(data: any) {
    return this.http.post<any>(this.api, data);
  }

  saveSession(token: string, rememberMe: boolean) {
    if (rememberMe) {
      localStorage.setItem('token', token);
    } else {
      sessionStorage.setItem('token', token);
    }
  }

  isLoggedIn(): boolean {
    return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
  }
}
