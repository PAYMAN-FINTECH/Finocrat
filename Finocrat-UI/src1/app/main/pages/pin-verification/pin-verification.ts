import {
  Component,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  AfterViewInit,
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
export class PinVerificationComponent implements AfterViewInit, OnInit {

  @ViewChild('pinInput') pinInput!: ElementRef;
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

  ngAfterViewInit(): void {
    this.focusInput();
  }

  focusInput() {
    setTimeout(() => {
      this.pinInput?.nativeElement.focus();
    }, 100);
  }

  onInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 4) {
      value = value.slice(0, 4);
    }
    
    this.pin = value;
    this.error = '';
    
    if (this.pin.length === 4) {
      this.verify();
    }
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
        
        if (this.pinInput?.nativeElement) {
          this.pinInput.nativeElement.value = '';
        }
        
        this.focusInput();
      }
    });
  }
}