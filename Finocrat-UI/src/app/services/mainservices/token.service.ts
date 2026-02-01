import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {

  // saveToken(token: string, remember: boolean) {
  //   if (remember) {
  //     localStorage.setItem('token', token);
  //   } else {
  //     sessionStorage.setItem('token', token);
  //   }
  // }

  getToken(): string | null {
    return localStorage.getItem('token')
        || sessionStorage.getItem('token');
  }

  clear() {
    localStorage.clear();
    sessionStorage.clear();
  }

  saveToken(token: string, user: any) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}
