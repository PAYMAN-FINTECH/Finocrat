import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  ActivatedRoute
} from '@angular/router';

import {
  HttpClient
} from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector:
    'app-invoice-verify',

  standalone: true,

  imports: [
    CommonModule
  ],

  templateUrl:
    './invoice-verify.html',

  styleUrls:
    ['./invoice-verify.css']
})
export class InvoiceVerifyComponent
  implements OnInit {

  invoice: any = null;

  loading = true;

  error = '';
  private baseUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,

    private http: HttpClient
  ) {}

  ngOnInit(): void {

    const invoiceNo = this.route.snapshot.paramMap.get('invoiceNo');
    const transactionId = this.route.snapshot.paramMap.get('transactionId');

    console.log('Invoice No:', invoiceNo);
    console.log('Transaction ID:', transactionId);

    if (!invoiceNo || !transactionId) {
      this.error = 'Invalid verification URL';
      this.loading = false;
      return;
    }


    this.http.get(
       `${this.baseUrl}/dashboard/verify/${encodeURIComponent(invoiceNo)}/${encodeURIComponent(transactionId)}`
    )
    .subscribe({

      next: (data) => {

        this.invoice =
          data;

        this.loading =
          false;
      },

      error: () => {

        this.error =
          'Invoice not found.';

        this.loading =
          false;
      }

    });
  }
}