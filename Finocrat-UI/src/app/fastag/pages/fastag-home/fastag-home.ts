// fastag/pages/fastag-home/fastag-home.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FastagBillPaymentComponent } from '../fastag-bill-payment/fastag-bill-payment';

@Component({
  selector: 'app-fastag-home',
  standalone: true,
  imports: [CommonModule, FastagBillPaymentComponent],
  template: `
    <div class="fastag-home">
      <app-fastag-bill-payment></app-fastag-bill-payment>
    </div>
  `,
  styles: [`
    .fastag-home {
      max-width: 1200px;
      margin: 0 auto;
    }
  `]
})
export class FastagHomeComponent {}