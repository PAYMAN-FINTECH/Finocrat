import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { HeaderComponent as EduHeaderComponent } from './edu/components/header/header';
import { FooterComponent as EduFooterComponent } from './edu/components/footer/footer';
import { MainheaderComponent } from './main/components/mainheader/mainheader';
import { MainfooterComponent } from './main/components/mainfooter/mainfooter';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from "./main/components/loader/loader";

import { InactivityService } from './services/mainservices/inactivity.service';
import { PinVerificationComponent } from './main/pages/pin-verification/pin-verification';
import { TokenService } from './services/mainservices/token.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    EduHeaderComponent,
    EduFooterComponent,
    MainheaderComponent,
    MainfooterComponent,
    LoaderComponent,
    PinVerificationComponent
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {

  isEdu = window.location.hostname.startsWith('edu.');
  isFastag = window.location.hostname.startsWith('fastag');
  
  showFooter = true;
  showGlobalPin = false;
  private sub!: Subscription;

  constructor(
    private router: Router,
    private inactivity: InactivityService,
    private tokenService: TokenService
  ) {
    window.addEventListener('lockApp', () => {
      console.log('🔒 Lock event received');
      this.lockApp();
    });
  }

  ngOnInit() {
    const token = this.tokenService.getToken();
    const user = this.tokenService.getUser();
    
    console.log('App Init - Token value:', token);
    console.log('App Init - Token exists:', !!token);
    console.log('App Init - User:', user);
    console.log('App Init - PIN Verified:', sessionStorage.getItem('pin_verified'));
    
    if (token && token !== 'null' && user && user?.pin) {
      // Start inactivity tracking
      this.startInactivityTracking();
    }

    this.updateFooter(this.router.url);
    this.sub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        const url = e.urlAfterRedirects ?? e.url;
        this.updateFooter(url);
        
        if (this.showGlobalPin === false && token && user?.pin) {
          this.inactivity.reset();
        }
      });
  }

  startInactivityTracking() {
    console.log('Starting inactivity tracking');
    this.inactivity.startWatching(() => {
      this.lockApp();
    });
  }

  lockApp() {
    console.log("🔒 App Locked due to inactivity");
    sessionStorage.removeItem('pin_verified');
    this.showGlobalPin = true;
    document.body.classList.add('no-scroll');
  }

  unlockApp() {
    console.log("🔓 App Unlocked Successfully");
    sessionStorage.setItem('pin_verified', 'true');
    this.showGlobalPin = false;
    document.body.classList.remove('no-scroll');
    
    const user = this.tokenService.getUser();
    if (user?.pin) {
      this.inactivity.reset();
    }
  }

  private updateFooter(url: string) {
    const path = (url || '').split('?')[0] || '';
    const isLogin = path === '/dashboard' || path === '/' || path === '/login';
    this.showFooter = !isLogin;
  }

  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
    this.inactivity.stopWatching();
    window.removeEventListener('lockApp', () => {});
  }
}