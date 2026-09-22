import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PinVerificationComponent } from '../pin-verification/pin-verification';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-verify-pin-page',
  standalone: true,
  imports: [CommonModule, PinVerificationComponent],
  template: `
    <div class="verify-pin-container">
      <app-pin-verification
        [redirectAfterSuccess]="false"
        (success)="onPinSuccess()">
      </app-pin-verification>
    </div>
  `,
  styles: [`
    .verify-pin-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class VerifyPinPageComponent implements OnInit {
  
  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  ngOnInit() {
    console.log('VerifyPinPageComponent loaded');
    const user = this.tokenService.getUser();
    const token = this.tokenService.getToken();
    
    console.log('Token:', !!token);
    console.log('User:', user);
    
    if (!token || !user) {
      console.log('No session found, redirecting to login');
      this.router.navigate(['/dashboard/login']);
      return;
    }
    
    if (!user.pin) {
      console.log('No PIN set, redirecting to set-pin');
      this.router.navigate(['/dashboard/set-pin']);
      return;
    }
    
    const isPinVerified = sessionStorage.getItem('pin_verified') === 'true';
    if (isPinVerified) {
      console.log('Already verified, redirecting to finhome');
      this.router.navigate(['/app/finhome']);
    }
  }

  onPinSuccess() {
    console.log('PIN verification successful');
    
    const token = this.tokenService.getToken();
    const user = this.tokenService.getUser();
    
    if (!token || !user) {
      console.error('Session lost! Redirecting to login');
      this.router.navigate(['/dashboard/login']);
      return;
    }
    
    sessionStorage.setItem('pin_verified', 'true');
    console.log('Navigating to finhome');
    this.router.navigate(['/app/finhome']);
  }
}