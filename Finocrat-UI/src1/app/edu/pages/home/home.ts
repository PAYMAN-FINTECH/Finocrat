import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'edu-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent {
  courses = [
    {
      title: 'Digital Marketing Strategy',
      description: 'SEO, Ads, Analytics & Growth'
    },
    {
      title: 'FinTech & Payment Systems',
      description: 'UPI, Cards, Wallets & Gateways'
    },
    {
      title: 'Business Payments',
      description: 'End-to-end payment ecosystem'
    }
  ];
}
