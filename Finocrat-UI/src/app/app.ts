

import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { HeaderComponent as EduHeaderComponent } from './edu/components/header/header';
import { FooterComponent as EduFooterComponent } from './edu/components/footer/footer';
import { MainheaderComponent } from './main/components/mainheader/mainheader';
import { MainfooterComponent } from './main/components/mainfooter/mainfooter';
import { CommonModule } from '@angular/common';
import { LoaderComponent } from "./main/components/loader/loader";

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
    LoaderComponent
],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  isEdu = window.location.hostname.startsWith('edu.');
  showFooter = true;

  constructor(private router: Router) {
    // initialize and respond to navigation changes
    this.updateFooter(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e: any) => {
      const url = e.urlAfterRedirects ?? e.url;
      this.updateFooter(url);
    });
  }

  private updateFooter(url: string) {
    const path = (url || '').split('?')[0] || '';
    // hide footer for login routes
    const isLogin = path === '/dashboard' || path === '/';
    this.showFooter = !isLogin;
  }
}

