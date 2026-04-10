import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';
import { TokenService } from '../../../services/mainservices/token.service';
import { PayInService } from '../../../services/mainservices/payin.service';

@Component({
  selector: 'app-passbook',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pass-book.html',
  styleUrls: ['./pass-book.css']
})
export class PassbookComponent implements OnInit {

  transactions: any[] = [];
  groupedData: any = {};

  fromDate = '';
  toDate = '';

  userPhone = '';

  constructor(
    private service: HomeService,
    private token: TokenService,
    private payinservice : PayInService
  ) {}

  ngOnInit() {
    const user = this.token.getUser();
    this.userPhone = user?.userPhone || '';

    this.loadPassbook();
  }

  loadPassbook() {
    this.payinservice.getPassbook(this.userPhone, this.fromDate, this.toDate)
      .subscribe(res => {
        this.transactions = res;
        this.groupByDate();
      });
  }

  groupByDate() {
    this.groupedData = {};

    this.transactions.forEach(tx => {
      const date = new Date(tx.createdAt).toDateString();

      if (!this.groupedData[date]) {
        this.groupedData[date] = [];
      }

      this.groupedData[date].push(tx);
    });
  }
}