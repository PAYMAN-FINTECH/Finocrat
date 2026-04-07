import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private TOKEN_KEY = 'auth_token';
  private USER_KEY = 'user_data';

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('TokenService.getToken - Token exists:', !!token);
    return token;
  }

  clear() {
    console.log('TokenService.clear - Clearing all data');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem('pin_verified');
  }
  
  saveToken(token: string, user: any) {
    console.log('TokenService.saveToken - Saving token and user');
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // Verify save was successful
    const savedToken = localStorage.getItem(this.TOKEN_KEY);
    console.log('Token saved successfully:', !!savedToken);
  }

  getUser() {
    const u = localStorage.getItem(this.USER_KEY);
    const user = u ? JSON.parse(u) : null;
    console.log('TokenService.getUser - User exists:', !!user);
    return user;
  }

  getuserPhone(): string | null {
    const user = this.getUser();
    return user ? user.userPhone : null;
  }
  
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch {
      return false;
    }
  }
}