// fastag/components/fastag-footer/fastag-footer.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-fastag-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="fastag-footer">
      <div class="container">
        
        <!-- Company Info -->
        <div class="footer-section">
          <div class="footer-logo">
            <span class="logo-icon">🚗</span>
            <span class="logo-text">Finocrat FASTag</span>
          </div>
          <p class="company-tagline">India's most trusted digital payment platform for FASTag recharge and bill payments.</p>
        </div>

        <!-- Quick Links -->
        <div class="footer-section">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a routerLink="/fastag">Home</a></li>
            <li><a routerLink="/fastag/support">Support</a></li>
            <li><a routerLink="/fastag/faq">FAQs</a></li>
          </ul>
        </div>

        <!-- Policies -->
        <div class="footer-section">
          <h4>Policies</h4>
          <ul class="footer-links">
            <li><a routerLink="/fastag/about">About Us</a></li>
            <li><a routerLink="/fastag/privacy-policy">Privacy Policy</a></li>
            <li><a routerLink="/fastag/refund-policy">Refund Policy</a></li>
            <li><a routerLink="/fastag/terms">Terms & Conditions</a></li>
            <li><a routerLink="/fastag/contact">Contact Us</a></li>
          </ul>
        </div>

        <!-- Contact Info -->
        <div class="footer-section">
          <h4>Contact Us</h4>
          <ul class="contact-info">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M22 16.92V19C22 19.5304 21.7893 20.0391 21.4142 20.4142C21.0391 20.7893 20.5304 21 20 21C16.0999 20.763 12.4203 19.338 9.54013 16.9545C6.67918 14.5884 4.69473 11.3364 3.92 7.73001C3.78953 7.22467 3.82391 6.69351 4.01877 6.20691C4.21363 5.72031 4.55866 5.30385 5 5.01001C5.44703 4.70986 5.97397 4.55065 6.51 4.55001H8.5C9.0235 4.54316 9.52374 4.75757 9.8835 5.14263C10.2433 5.52769 10.4293 6.04406 10.4 6.57001C10.3467 7.40213 10.2087 8.22649 9.99 9.03001C9.85266 9.51249 9.58991 9.95102 9.23 10.3"/>
              </svg>
              <a href="tel:+917702205291">+91 7702205291</a>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"/>
                <path d="M22 6L12 13L2 6"/>
              </svg>
              <a href="mailto:operations@thefinocrat.com">operations@thefinocrat.com</a>
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              <span>Premises bearing No H.No. 7-1-414/B, Mankammathtoa,Opp Shivani Degree College, Karimnagar,Karimnagar, Telangana – 505001</span>
            </li>
          </ul>
        </div>

        <!-- Social Media -->
        <div class="footer-section">
          <h4>Follow Us</h4>
          <div class="social-icons">
            <a href="https://facebook.com/" target="_blank" class="social-icon facebook" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="https://twitter.com/" target="_blank" class="social-icon twitter" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
            <a href="https://linkedin.com/company/" target="_blank" class="social-icon linkedin" aria-label="LinkedIn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
            <a href="https://instagram.com/" target="_blank" class="social-icon instagram" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://youtube.com/" target="_blank" class="social-icon youtube" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
          </div>
        </div>

      </div>

      <!-- Bottom Bar -->
      <div class="footer-bottom">
        <div class="container">
          <p>&copy; {{ currentYear }} Finocrat. All rights reserved. | RBI Compliant | Secure Payments</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .fastag-footer {
      background: #0f172a;
      color: #94a3b8;
      margin-top: auto;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 30px;
    }

    /* Footer Sections */
    .footer-section {
      display: flex;
      flex-direction: column;
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 15px;
    }

    .logo-icon {
      font-size: 28px;
    }

    .logo-text {
      font-size: 18px;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .company-tagline {
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
      color: #94a3b8;
    }

    .footer-section h4 {
      color: white;
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 15px 0;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 10px;
    }

    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 13px;
      transition: color 0.2s ease;
    }

    .footer-links a:hover {
      color: #667eea;
    }

    /* Contact Info */
    .contact-info {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .contact-info li {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      font-size: 13px;
      color: #94a3b8;
    }

    .contact-info a {
      color: #94a3b8;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .contact-info a:hover {
      color: #667eea;
    }

    .contact-info svg {
      flex-shrink: 0;
      color: #667eea;
    }

    /* Social Icons */
    .social-icons {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
    }

    .social-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      text-decoration: none;
    }

    .social-icon.facebook {
      background: #1877f2;
      color: white;
    }

    .social-icon.twitter {
      background: #1da1f2;
      color: white;
    }

    .social-icon.linkedin {
      background: #0077b5;
      color: white;
    }

    .social-icon.instagram {
      background: #e4405f;
      color: white;
    }

    .social-icon.youtube {
      background: #ff0000;
      color: white;
    }

    .social-icon:hover {
      transform: translateY(-3px);
      opacity: 0.9;
    }

    /* Footer Bottom */
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding: 15px 0;
      text-align: center;
    }

    .footer-bottom .container {
      padding: 0 20px;
      text-align: center;
    }

    .footer-bottom p {
      margin: 0;
      font-size: 12px;
      color: #64748b;
    }

    /* Responsive */
    @media (max-width: 992px) {
      .container {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .container {
        grid-template-columns: 1fr;
        text-align: center;
        gap: 25px;
      }

      .footer-section {
        align-items: center;
        text-align: center;
      }

      .contact-info li {
        justify-content: center;
      }

      .social-icons {
        justify-content: center;
      }

      .footer-logo {
        justify-content: center;
      }
    }
  `]
})
export class FastagFooterComponent {
  currentYear: number = new Date().getFullYear();
}