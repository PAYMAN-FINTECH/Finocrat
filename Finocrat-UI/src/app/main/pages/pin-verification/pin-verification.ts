import {
  Component,
  Output,
  EventEmitter,
  HostListener,
  Input,
  OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HomeService } from '../../../services/mainservices/home.service';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-pin-verification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pin-verification.html',
  styleUrls: ['./pin-verification.css']
})
export class PinVerificationComponent implements OnInit {

  @Output() success = new EventEmitter<void>();
  @Input() redirectAfterSuccess: boolean = false;
  @Input() returnUrl: string = '/app/finhome';

  pin = '';
  error = '';
  isLoading = false;
  userPhone = '';
  attempts = 0;
  maxAttempts = 3;

  constructor(
    private service: HomeService,
    private token: TokenService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const user = this.token.getUser();
    this.userPhone = user?.userPhone || '';

    console.log('PinVerification - User:', user);
    console.log('PinVerification - UserPhone:', this.userPhone);

    if (!this.userPhone) {
      console.error('❌ User phone missing');
      this.toastr.error('Session expired. Please login again');
      setTimeout(() => {
        this.token.clear();
        this.router.navigate(['/dashboard/login']);
      }, 2000);
    }
  }

  // Listens on the document so typing works without the input holding focus
  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      this.addDigit(event.key);
    } else if (event.key === 'Backspace') {
      event.preventDefault();
      this.deleteDigit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.clearPin();
    }
  }

  addDigit(digit: string) {
    if (this.isLoading || this.pin.length >= 4) return;

    this.pin += digit;
    this.error = '';

    if (this.pin.length === 4) {
      this.verify();
    }
  }

  deleteDigit() {
    if (this.isLoading) return;
    this.pin = this.pin.slice(0, -1);
    this.error = '';
  }

  clearPin() {
    if (this.isLoading) return;
    this.pin = '';
    this.error = '';
  }

  verify() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    
    const payload = {
      UserPhone: this.userPhone,
      Pin: this.pin
    };
    
    console.log('Verifying PIN for:', this.userPhone);
    
    this.service.verifyPin(payload).subscribe({
      next: (response) => {
        console.log("✅ PIN VERIFIED", response);
        this.isLoading = false;
        this.attempts = 0;
        this.error = '';
        
        // Set PIN verified flag for this session only
        sessionStorage.setItem('pin_verified', 'true');
        
        if (this.redirectAfterSuccess) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.success.emit();
        }
      },
      error: (err) => {
        console.error('PIN verification error:', err);
        this.isLoading = false;
        this.attempts++;
        
        if (this.attempts >= this.maxAttempts) {
          this.toastr.error('Too many failed attempts. Please login again');
          // Only clear on too many failed attempts
          this.token.clear();
          sessionStorage.clear();
          this.router.navigate(['/dashboard/login']);
          return;
        }
        
        this.error = `Wrong PIN. ${this.maxAttempts - this.attempts} attempt${this.maxAttempts - this.attempts > 1 ? 's' : ''} left`;
        this.pin = '';
      }
    });
  }
}