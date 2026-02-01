import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HomeService {

  private api = 'https://thefinocrat.com/api/dashboard';

  constructor(private http: HttpClient) {}

  getStats(payload: any) {
    return this.http.post<any>(this.api, payload);
  }
}
