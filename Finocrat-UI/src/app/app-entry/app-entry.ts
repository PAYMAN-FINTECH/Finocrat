import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-entry',
  standalone: true,
  template: ''
})
export class AppEntryComponent implements OnInit {

  constructor(private router: Router) {}

  ngOnInit(): void {
    const isEduDomain = window.location.hostname.startsWith('edu.');

    if (isEduDomain) {
      // https://edu.thefinocrat.com
      this.router.navigateByUrl('/edu');
    } else {
      // https://thefinocrat.com
      this.router.navigateByUrl('/dashboard');
    }
  }
}
