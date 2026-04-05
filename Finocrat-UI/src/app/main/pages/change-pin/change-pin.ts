import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-change-pin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-pin.html',
  styleUrls: ['./change-pin.css']
})
export class ChangePinComponent {

  @Input() userPhone: string = '';

  oldPin = '';
  newPin = '';
  confirmPin = '';

  isLoading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private securityService: HomeService) {}

  validate(): boolean {

    this.errorMsg = '';
    this.successMsg = '';

    if (!this.oldPin || !this.newPin || !this.confirmPin) {
      this.errorMsg = "All fields required";
      return false;
    }

    if (this.newPin.length !== 4 || !/^\d+$/.test(this.newPin)) {
      this.errorMsg = "Enter valid 4 digit PIN";
      return false;
    }

    if (this.newPin !== this.confirmPin) {
      this.errorMsg = "PIN mismatch";
      return false;
    }

    if (this.oldPin === this.newPin) {
      this.errorMsg = "New PIN must be different";
      return false;
    }

    return true;
  }

  changePin() {

    if (!this.validate()) return;

    this.isLoading = true;

    this.securityService.changePin({
      UserPhone: this.userPhone,
      OldPin: this.oldPin,
      NewPin: this.newPin
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMsg = res.message;
        this.oldPin = '';
        this.newPin = '';
        this.confirmPin = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message;
      }
    });
  }
}