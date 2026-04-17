// fastag/components/fastag-footer/fastag-footer.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-fastag-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="fastag-footer">
      <div class="container">
        <p>&copy; 2024 Finocrat FASTag. All rights reserved.</p>
        <div class="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact Support</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .fastag-footer {
      background: #1e293b;
      color: #94a3b8;
      padding: 20px 0;
      margin-top: auto;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 15px;
    }
    .footer-links {
      display: flex;
      gap: 20px;
    }
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
    }
    .footer-links a:hover {
      color: white;
    }
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FastagFooterComponent {}