// fastag/pages/fastag-privacy-policy/fastag-privacy-policy.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fastag-privacy-policy.html',
  styleUrls: ['./fastag-privacy-policy.css']
})
export class FastagPrivacyPolicyComponent {
  currentDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  effectiveDate: string = '16 September, 2025';
}