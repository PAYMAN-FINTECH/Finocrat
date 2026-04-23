// fastag/pages/fastag-about/fastag-about.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fastag-about.html',
  styleUrls: ['./fastag-about.css']
})
export class FastagAboutComponent {
  currentYear: number = new Date().getFullYear();

  features = [
    {
      icon: '⚡',
      title: 'Fast & Reliable',
      description: 'Instant recharge with real-time confirmation'
    },
    {
      icon: '🏦',
      title: 'All Banks Supported',
      description: 'Works with all major banks and FASTag issuers'
    },
    {
      icon: '🕐',
      title: '24/7 Availability',
      description: 'Recharge anytime, anywhere with instant confirmation'
    },
    {
      icon: '🔒',
      title: '100% Secure',
      description: 'SSL encrypted payments with bank-grade security'
    },
    {
      icon: '💬',
      title: 'Customer Support',
      description: 'Responsive support for all your recharge issues'
    },
    {
      icon: '📱',
      title: 'Mobile Optimized',
      description: 'User-friendly interface for mobile and desktop'
    }
  ];

  stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '50K+', label: 'Transactions' },
    { value: '24/7', label: 'Support Available' },
    { value: '100%', label: 'Secure Payments' }
  ];
}