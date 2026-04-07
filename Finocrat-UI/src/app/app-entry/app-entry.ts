import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TokenService } from '../services/mainservices/token.service';

@Component({
  selector: 'app-entry',
  standalone: true,
  template: ''
})
export class AppEntryComponent implements OnInit {

  constructor(
    private router: Router,
    private tokenService: TokenService
  ) {}

  ngOnInit(): void {
    const isEduDomain = window.location.hostname.startsWith('edu.');

    if (isEduDomain) {
      this.router.navigateByUrl('/edu');
      return;
    }

    const token = this.tokenService.getToken();
    const user = this.tokenService.getUser();
    
    console.log('AppEntry - Token:', !!token);
    console.log('AppEntry - User:', user);
    console.log('AppEntry - PIN Verified:', sessionStorage.getItem('pin_verified'));
    
    if (token && user) {
      // User is logged in - stay logged in
      if (user.pin) {
        // Check if PIN was verified in this session
        const isPinVerified = sessionStorage.getItem('pin_verified') === 'true';
        if (isPinVerified) {
          // PIN already verified, go to home
          console.log('AppEntry - PIN verified, going to finhome');
          this.router.navigateByUrl('/app/finhome');
        } else {
          // Need PIN verification for this session
          console.log('AppEntry - Need PIN verification');
          this.router.navigateByUrl('/dashboard/verify-pin');
        }
      } else {
        // No PIN set, go to set PIN
        console.log('AppEntry - No PIN set');
        this.router.navigateByUrl('/dashboard/set-pin');
      }
    } else {
      // Not logged in, go to landing page
      console.log('AppEntry - Not logged in');
      this.router.navigateByUrl('/dashboard');
    }
  }
}