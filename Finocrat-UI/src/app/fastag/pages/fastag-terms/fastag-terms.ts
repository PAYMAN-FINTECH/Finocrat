// fastag/pages/fastag-terms/fastag-terms.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-terms',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './fastag-terms.html',
  styleUrls: ['./fastag-terms.css']
})
export class FastagTermsComponent {
  currentDate: string = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}