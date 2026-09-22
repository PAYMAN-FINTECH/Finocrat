import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Token } from '@angular/compiler';
import { LoginResponse, SignupResponse, SignupRequestDto } from '../../Models/eduModels/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
 private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedInSubject.asObservable();

  private baseUrl = 'https://edu.thefinocrat.com/api/EduAuth';

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  constructor(private http: HttpClient) {}

  // 🔹 LOGIN
  login(data: any): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.baseUrl}/login`, data).pipe(
      tap(res => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
          this.loggedInSubject.next(true);
        }
      })
    );
  }

  // 🔹 SIGNUP
  signup(data: SignupRequestDto): Observable<SignupResponse> {
    return this.http.post<SignupResponse>(`${this.baseUrl}/signup`, data);
  }


  logout() {
    localStorage.removeItem('token');
    this.loggedInSubject.next(false);
  }

   isLoggedIn(): boolean {
    return this.loggedInSubject.value;
  }
}
