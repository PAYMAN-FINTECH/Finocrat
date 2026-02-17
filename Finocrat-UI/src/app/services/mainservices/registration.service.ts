import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  baseUrl = 'https://localhost:5001/api';

  constructor(private http: HttpClient) {}

  getMargins() {
    return this.http.get(`${this.baseUrl}/Margin`);
  }

  register(data: any) {
    return this.http.post(`${this.baseUrl}/Registration`, data);
  }
}