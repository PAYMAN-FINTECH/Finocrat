import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'edu-footer',
  standalone: true,
  imports: [RouterModule],   // 👈 VERY IMPORTANT
  template: `
    <footer class="footer">
      <div class="footer-links">
        <a routerLink="/edu/about">About</a>
        <a routerLink="/edu/contact">Contact</a>
        <a routerLink="/edu/terms">Terms and Conditions</a>
        <a routerLink="/edu/privacy">Privacy Policy</a>
        <a routerLink="/edu/refund">Refund Policy</a>
      </div>

      <div class="footer-copy">
        © 2026 Finocrat Edu. All rights reserved.
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #f8f9fa;
      border-top: 1px solid #ddd;
      padding: 20px 10px;
      text-align: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: #555;
    }

    .footer-links {
      margin-bottom: 8px;
    }

    .footer-links a {
      margin: 0 10px;
      text-decoration: none;
      color: #4a6fa5;
      font-weight: 500;
      cursor: pointer;
    }

    .footer-links a:hover {
      text-decoration: underline;
    }

    .footer-copy {
      color: #777;
      font-size: 13px;
    }
  `]
})
export class FooterComponent {}
