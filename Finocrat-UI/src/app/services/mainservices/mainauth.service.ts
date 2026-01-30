import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs';
import { TokenService } from './token.service';

@Injectable({ providedIn: 'root' })
export class MainAuthService {

  private api = 'https://yourapi.com/auth/login';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService
  ) {}

  login(data: any) {
    return this.http.post<any>(this.api, data).pipe(
      tap(res => {
        this.tokenService.saveToken(res.token, data.rememberMe);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.getToken();
  }

  logout() {
    this.tokenService.clear();
  }
}
