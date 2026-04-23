// fastag/pages/fastag-refund-policy/fastag-refund-policy.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-refund-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fastag-refund-policy.html',
  styleUrls: ['./fastag-refund-policy.css']
})
export class FastagRefundPolicyComponent {
  currentDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}