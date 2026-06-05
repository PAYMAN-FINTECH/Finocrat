import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule
} from '@angular/common/http';

@Component({
  selector: 'app-bbps',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  templateUrl: './bbps.html',
  styleUrls: ['./bbps.css']
})
export class BbpsComponent implements OnInit {

  categories: any[] = [];
  billers: any[] = [];

  selectedCategory = '';
  selectedBiller = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getCategories();
  }

  // Get Categories
  getCategories() {

    this.http.get<any>(
      'https://your-api-url.com/BillAvenue/GetCategories'
    ).subscribe({

      next: (res) => {

        console.log('Categories:', res);

        this.categories = res.data || res;

      },

      error: (err) => {

        console.log(err);

      }

    });

  }

  // Category Change
  onCategoryChange() {

    this.selectedBiller = '';
    this.billers = [];

    if (!this.selectedCategory) return;

    this.http.get<any>(
      `https://your-api-url.com/BillAvenue/GetBillers?category=${this.selectedCategory}`
    ).subscribe({

      next: (res) => {

        console.log('Billers:', res);

        this.billers = res.data || res;

      },

      error: (err) => {

        console.log(err);

      }

    });

  }

}