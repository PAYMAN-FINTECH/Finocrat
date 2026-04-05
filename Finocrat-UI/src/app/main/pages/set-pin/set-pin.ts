import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeService } from '../../../services/mainservices/home.service';

@Component({
  selector: 'app-set-pin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './set-pin.html',
  styleUrls: ['./set-pin.css']
})
export class SetPinComponent {

  @Input() userPhone: string = '';

  pin = '';
  confirmPin = '';

  isLoading = false;
  errorMsg = '';
  successMsg = '';

  constructor(private securityService: HomeService) {}

  validate(): boolean {

    this.errorMsg = '';
    this.successMsg = '';

    if (!this.pin || !this.confirmPin) {
      this.errorMsg = "All fields required";
      return false;
    }

    if (this.pin.length !== 4 || !/^\d+$/.test(this.pin)) {
      this.errorMsg = "Enter valid 4 digit PIN";
      return false;
    }

    if (this.pin !== this.confirmPin) {
      this.errorMsg = "PIN mismatch";
      return false;
    }

    return true;
  }

  setPin() {

    if (!this.validate()) return;

    this.isLoading = true;

    this.securityService.setPin({
      UserPhone: this.userPhone,
      Pin: this.pin
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMsg = res.message;
        this.pin = '';
        this.confirmPin = '';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMsg = err.error?.message;
      }
    });
  }
}