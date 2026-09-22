import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HomeService } from '../../../services/mainservices/home.service';
import { TokenService } from '../../../services/mainservices/token.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-pin.html',
  styleUrls: ['./change-pin.css']
})
export class ChangePinComponent implements OnInit {

  oldPin = '';
  newPin = '';
  confirmPin = '';
  userPhone = '';
  error = '';
  isLoading = false;
  showOldPin = false;
  showNewPin = false;
  showConfirmPin = false;

  constructor(
    private homeService: HomeService,
    private tokenService: TokenService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit() {
    const user = this.tokenService.getUser();
    this.userPhone = user?.userPhone || '';
    
    if (!this.userPhone) {
      this.toastr.error('Session expired');
      this.router.navigate(['/dashboard/login']);
    }
  }

  toggleOldPin() {
    this.showOldPin = !this.showOldPin;
  }

  toggleNewPin() {
    this.showNewPin = !this.showNewPin;
  }

  toggleConfirmPin() {
    this.showConfirmPin = !this.showConfirmPin;
  }

  changePin() {
    // Validation
    if (!this.oldPin || this.oldPin.length !== 4) {
      this.error = 'Please enter valid 4-digit old PIN';
      return;
    }
    
    if (!this.newPin || this.newPin.length !== 4) {
      this.error = 'Please enter valid 4-digit new PIN';
      return;
    }
    
    if (this.newPin !== this.confirmPin) {
      this.error = 'New PIN and Confirm PIN do not match';
      return;
    }
    
    if (this.oldPin === this.newPin) {
      this.error = 'New PIN must be different from old PIN';
      return;
    }
    
    this.error = '';
    this.isLoading = true;

    const payload = {
      UserPhone: this.userPhone,
      OldPin: this.oldPin,
      NewPin: this.newPin
    };

    this.homeService.changePin(payload).subscribe({
      next: (response) => {
        console.log('PIN changed successfully', response);
        this.isLoading = false;
        this.toastr.success('PIN changed successfully');
        
        // Update local storage if needed
        const user = this.tokenService.getUser();
        if (user) {
          user.pin = this.newPin;
          const token = this.tokenService.getToken();
          this.tokenService.saveToken(token!, user);
        }
        
        // Navigate back to profile
        setTimeout(() => {
          this.router.navigate(['/app/profile']);
        }, 1500);
      },
      error: (err) => {
        console.error('PIN change error:', err);
        this.isLoading = false;
        this.error = err.error?.message || 'Invalid old PIN';
        this.toastr.error(this.error);
      }
    });
  }

  cancel() {
    this.router.navigate(['/app/profile']);
  }
}