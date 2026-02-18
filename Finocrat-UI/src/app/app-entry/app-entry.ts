import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainAuthService } from '../services/mainservices/mainauth.service';

@Component({
  selector: 'app-entry',
  standalone: true,
  template: ''
})
export class AppEntryComponent implements OnInit {

  constructor(
    private router: Router,
    private auth: MainAuthService
  ) {}

  ngOnInit(): void {

    const isEduDomain = window.location.hostname.startsWith('edu.');

    if (isEduDomain) {
      this.router.navigateByUrl('/edu');
      return;
    }

    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/app/finhome');
    } else {
      this.router.navigateByUrl('/dashboard'); // Landing page
    }
  }
}