// main/pages/set-pin/set-pin.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  
  constructor(
    private fb: FormBuilder,
    public router: Router,  // Changed from private to public
    private toastr: ToastrService,
    private homeService: HomeService,
    private tokenService: TokenService
  ) {}
  
  ngOnInit() {
    // Check if user already has PIN
    const user = this.tokenService.getUser();
    if (user?.pin) {
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
    const user = this.tokenService.getUser();
    
    if (!user || !user.userPhone) {
      this.toastr.error('User session expired. Please login again');
      this.router.navigate(['/dashboard/login']);
      return;
    }
    
    const payload = {
      UserPhone: user.userPhone,
      Pin: this.pinForm.get('pin')?.value
    };
    
    console.log('Setting PIN for:', user.userPhone);
    
    this.homeService.setPin(payload).subscribe({
      next: (response) => {
        console.log('PIN set successfully', response);
        this.toastr.success('PIN set successfully! Please verify your PIN.');
        
        // Update user data with PIN status
        const updatedUser = {
          ...user,
          pin: true
        };
        
        const token = this.tokenService.getToken();
        this.tokenService.saveToken(token!, updatedUser);
        
        // Clear any existing PIN verification
        sessionStorage.removeItem('pin_verified');
        
        // Navigate to verify PIN page
        setTimeout(() => {
          this.router.navigate(['/dashboard/verify-pin']);
        }, 1500);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to set PIN:', err);
        this.toastr.error(err.error?.message || 'Failed to set PIN. Please try again.');
        this.isLoading = false;
      }
    });
  }
  
  // Add method to skip for now
  skipForNow() {
    this.router.navigate(['/dashboard/login']);
  }
}