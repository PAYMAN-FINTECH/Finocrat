// main/pages/set-pin/set-pin.component.ts (Updated)
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { HomeService } from '../../../services/mainservices/home.service';
import { TokenService } from '../../../services/mainservices/token.service';

@Component({
  selector: 'app-set-pin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './set-pin.html',
  styleUrls: ['./set-pin.css']
})
export class SetPinComponent implements OnInit {
  
  pinForm!: FormGroup;
  isLoading = false;
  showPin = false;
  showConfirmPin = false;
  isResetFlow = false;
  resetUserId = '';

  constructor(
    private fb: FormBuilder,
    public router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private homeService: HomeService,
    private tokenService: TokenService
  ) {}
  
  ngOnInit() {
    // Check if this is a reset PIN flow
    this.route.queryParams.subscribe(params => {
      this.isResetFlow = params['isReset'] === 'true';
      this.resetUserId = sessionStorage.getItem('resetPinUserId') || '';
      
      if (this.isResetFlow && this.resetUserId) {
        console.log('Reset PIN flow for user:', this.resetUserId);
      }
    });
    
    // Check if user already has PIN (only for normal flow)
    const user = this.tokenService.getUser();
    if (!this.isResetFlow && user?.pin) {
      this.toastr.info('PIN already set. Please verify your PIN.');
      this.router.navigate(['/dashboard/verify-pin']);
      return;
    }
    
    this.pinForm = this.fb.group({
      pin: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(4), Validators.pattern('^[0-9]{4}$')]],
      confirmPin: ['', [Validators.required]]
    }, {
      validator: this.pinMatchValidator.bind(this)
    });
  }
  
  pinMatchValidator(group: FormGroup) {
    const pin = group.get('pin')?.value;
    const confirmPin = group.get('confirmPin')?.value;
    return pin === confirmPin ? null : { mismatch: true };
  }
  
  togglePin() {
    this.showPin = !this.showPin;
  }
  
  toggleConfirmPin() {
    this.showConfirmPin = !this.showConfirmPin;
  }
  
  onSubmit() {
    if (this.pinForm.invalid) {
      if (this.pinForm.errors?.['mismatch']) {
        this.toastr.error('PIN and Confirm PIN do not match');
      } else {
        this.toastr.warning('Please enter a valid 4-digit PIN');
      }
      return;
    }
    
    this.isLoading = true;
    
    let userPhone = '';
    let token = '';
    
    if (this.isResetFlow && this.resetUserId) {
      // Reset PIN flow - use the userId from forgot pin
      userPhone = this.resetUserId;
      token = '';
    } else {
      // Normal set PIN flow
      const user = this.tokenService.getUser();
      userPhone = user?.userPhone;
      token = this.tokenService.getToken()!;
    }
    
    if (!userPhone) {
      this.toastr.error('User session expired. Please login again');
      this.router.navigate(['/dashboard/login']);
      return;
    }
    
    const payload = {
      UserPhone: userPhone,
      Pin: this.pinForm.get('pin')?.value
    };
    
    console.log('Setting PIN for:', userPhone);
    console.log('Is reset flow:', this.isResetFlow);
    
    this.homeService.setPin(payload).subscribe({
      next: (response) => {
        console.log('PIN set successfully', response);
        
        if (this.isResetFlow) {
          this.toastr.success('PIN reset successfully! Please login with your new PIN.');
          // Clear session storage
          sessionStorage.removeItem('resetPinUserId');
          sessionStorage.removeItem('pin_verified');
          // Navigate to login
          setTimeout(() => {
            this.router.navigate(['/dashboard/login']);
          }, 1500);
        } else {
          this.toastr.success('PIN set successfully! Please verify your PIN.');
          // Update user data with PIN status
          const user = this.tokenService.getUser();
          if (user) {
            const updatedUser = { ...user, pin: true };
            this.tokenService.saveToken(token, updatedUser);
          }
          sessionStorage.removeItem('pin_verified');
          setTimeout(() => {
            this.router.navigate(['/dashboard/verify-pin']);
          }, 1500);
        }
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to set PIN:', err);
        this.toastr.error(err.error?.message || 'Failed to set PIN. Please try again.');
        this.isLoading = false;
      }
    });
  }
  
  skipForNow() {
    if (this.isResetFlow) {
      this.router.navigate(['/dashboard/login']);
    } else {
      this.router.navigate(['/dashboard/login']);
    }
  }
}