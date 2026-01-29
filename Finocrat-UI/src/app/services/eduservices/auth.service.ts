import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
 private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedInSubject.asObservable();

  private baseUrl = 'https://your-api-url/api/auth';

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  constructor(private http: HttpClient) {}

  login(data: any) {
    //return this.http.post(`${this.baseUrl}/login`, data);

        localStorage.setItem('token', "tokenvale");
        this.loggedInSubject.next(true);
        return this.loggedInSubject.asObservable();
  }

//   login(token: string) {
//     localStorage.setItem('token', token);
//     this.loggedInSubject.next(true);
//   }

  signup(data: any) {
    return this.http.post(`${this.baseUrl}/signup`, data);
  }
  logout() {
    localStorage.removeItem('token');
    this.loggedInSubject.next(false);
  }

   isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
}
